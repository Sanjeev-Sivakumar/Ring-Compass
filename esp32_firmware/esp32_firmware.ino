/*
 * =============================================================================
 * RING COMPASS v2.0 - ESP32 PHYSICAL HARDWARE EDGE NODE FIRMWARE
 * 5-SECOND ALERT BEEP (D15) & INDEPENDENT AMBER PATHWAY LED (D4)
 * =============================================================================
 * Hardware Pin Connections:
 *  - Speaker / Buzzer (+) Positive: GPIO 15 (Pin D15) -> Clean 1000 Hz 5s Alert Beep
 *  - Speaker / Buzzer (-) Negative: GND
 *  - Amber LED (+) Anode:           GPIO 4  (Pin D4)  -> Independent Amber Pathway Light
 *  - Amber LED (-) Cathode:         GND (via 220-330 ohm resistor)
 *  - Onboard Status LED:            GPIO 2  (Pin D2)
 *  - Physical BOOT Test Button:     GPIO 0  (Onboard BOOT button)
 *
 * Network Configuration:
 *  - Target IP: 192.168.1.113 (or assigned via DHCP - check Serial Monitor).
 * =============================================================================
 */

#include <WiFi.h>
#include <WebServer.h>
#include <ESPmDNS.h>

// -----------------------------------------------------------------------------
// 1. WI-FI CREDENTIALS
// -----------------------------------------------------------------------------
const char* WIFI_SSID     = "Home";          // <-- Replace with your Wi-Fi SSID
const char* WIFI_PASSWORD = "Home@2019";      // <-- Replace with your Wi-Fi Password

// Static IP Configuration (Matches default in .env)
IPAddress staticIP(192, 168, 1, 113);
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 255, 0);
IPAddress dns(8, 8, 8, 8);

// -----------------------------------------------------------------------------
// 2. PIN DEFINITIONS
// -----------------------------------------------------------------------------
const int PIN_SPEAKER     = 15;  // Speaker / Buzzer on GPIO 15 (Pin D15)
const int PIN_AMBER_LED   = 4;   // Amber Pathway LED on GPIO 4 (Pin D4)
const int PIN_STATUS_LED  = 2;   // Onboard Blue Status LED on GPIO 2 (Pin D2)
const int PIN_BOOT_BTN    = 0;   // Physical BOOT Button on ESP32 DevKit

WebServer server(80);

// -----------------------------------------------------------------------------
// 3. INDEPENDENT HARDWARE STATES
// -----------------------------------------------------------------------------
// Amber LED (Pin D4) State
bool is_led_on          = false;
bool is_led_blinking    = false;
bool is_led_locked_on   = false;  // When turned ON from Home & Voice, stays on throughout!
unsigned long led_blink_timer = 0;
bool led_blink_phase    = false;
unsigned long led_auto_off_time = 0;

// Speaker (Pin D15) 5-Second Alert Beep State
bool is_speaker_beeping        = false;
unsigned long speaker_off_time = 0;
const int BEEP_FREQ_HZ         = 1000; // Clean, standard 1000 Hz alert beep (not musical tune)

// Active Telemetry Metadata
String active_camera  = "NONE";
String active_event   = "NOMINAL";
String active_action  = "STANDBY";
String active_profile = "IDLE";

// -----------------------------------------------------------------------------
// 4. CLEAN 5-SECOND ALERT BEEP ENGINE (Pin D15)
// -----------------------------------------------------------------------------
void start_speaker_beep(int duration_ms = 5000) {
  is_speaker_beeping = true;
  speaker_off_time = millis() + duration_ms;

#if defined(ESP_ARDUINO_VERSION_MAJOR) && (ESP_ARDUINO_VERSION_MAJOR >= 3)
  ledcWriteTone(PIN_SPEAKER, BEEP_FREQ_HZ);
#else
  ledcWriteTone(0, BEEP_FREQ_HZ);
#endif
  tone(PIN_SPEAKER, BEEP_FREQ_HZ); // Universal Arduino tone

  Serial.printf("[HARDWARE_SPEAKER] 5-Second Alert Beep ACTIVE (%d Hz for %d ms)\n", BEEP_FREQ_HZ, duration_ms);
}

void stop_speaker_beep() {
  is_speaker_beeping = false;
  speaker_off_time = 0;

#if defined(ESP_ARDUINO_VERSION_MAJOR) && (ESP_ARDUINO_VERSION_MAJOR >= 3)
  ledcWriteTone(PIN_SPEAKER, 0);
#else
  ledcWriteTone(0, 0);
#endif
  noTone(PIN_SPEAKER);
  digitalWrite(PIN_SPEAKER, LOW);

  Serial.println("[HARDWARE_SPEAKER] Alert Beep OFF. Pin D15 silent.");
}

void init_speaker() {
#if defined(ESP_ARDUINO_VERSION_MAJOR) && (ESP_ARDUINO_VERSION_MAJOR >= 3)
  ledcAttach(PIN_SPEAKER, 1000, 8);
#else
  ledcSetup(0, 1000, 8);
  ledcAttachPin(PIN_SPEAKER, 0);
#endif
  stop_speaker_beep();
}

// -----------------------------------------------------------------------------
// 5. INDEPENDENT AMBER LED CONTROL FUNCTIONS
// -----------------------------------------------------------------------------
void set_led_locked_on(bool locked) {
  is_led_locked_on = locked;
  is_led_blinking  = false;
  is_led_on        = locked;
  digitalWrite(PIN_AMBER_LED, locked ? HIGH : LOW);
  digitalWrite(PIN_STATUS_LED, locked ? HIGH : LOW);
  Serial.printf("[HARDWARE_LED] Amber LED %s (Locked ON throughout: %s)\n",
                locked ? "ON" : "OFF", locked ? "YES" : "NO");
}

void trigger_led_alert_blink(int duration_ms = 5000) {
  if (is_led_locked_on) {
    // If the light was onned from Home & Voice, it must stay on throughout!
    digitalWrite(PIN_AMBER_LED, HIGH);
    Serial.println("[HARDWARE_LED] Amber LED is locked ON from Home & Voice; remaining solidly illuminated.");
    return;
  }
  is_led_on = true;
  is_led_blinking = true;
  led_auto_off_time = millis() + duration_ms;
  digitalWrite(PIN_AMBER_LED, HIGH);
  digitalWrite(PIN_STATUS_LED, HIGH);
  Serial.printf("[HARDWARE_LED] Amber LED BLINKING for %d ms\n", duration_ms);
}

void turn_off_led_individual() {
  is_led_locked_on = false;
  is_led_blinking  = false;
  is_led_on        = false;
  digitalWrite(PIN_AMBER_LED, LOW);
  digitalWrite(PIN_STATUS_LED, LOW);
  Serial.println("[HARDWARE_LED] Amber LED turned OFF individually.");
}

// -----------------------------------------------------------------------------
// 6. HTTP REST API HANDLERS (Completely Independent Hardware Controls)
// -----------------------------------------------------------------------------
void handle_status() {
  String led_state_str = "off";
  if (is_led_locked_on) {
    led_state_str = "on";
  } else if (is_led_blinking) {
    led_state_str = "blinking";
  } else if (is_led_on) {
    led_state_str = "on";
  }

  String json = "{";
  json += "\"status\":\"ONLINE\",";
  json += "\"device\":\"ESP32_RING_COMPASS_EDGE_NODE\",";
  json += "\"ip\":\"" + WiFi.localIP().toString() + "\",";
  json += "\"rssi\":" + String(WiFi.RSSI()) + ",";
  json += "\"uptime_sec\":" + String(millis() / 1000) + ",";
  
  // Independent Light State
  json += "\"led_state\":\"" + led_state_str + "\",";
  json += "\"is_led_on\":" + String((is_led_on || is_led_locked_on) ? "true" : "false") + ",";
  json += "\"is_led_blinking\":" + String(is_led_blinking ? "true" : "false") + ",";
  json += "\"is_led_locked_on\":" + String(is_led_locked_on ? "true" : "false") + ",";

  // Independent Speaker Beep State (mapped so frontend blinks indicator while beeping)
  json += "\"speaker_state\":\"" + String(is_speaker_beeping ? "speaking" : "idle") + "\",";
  json += "\"is_speaker_speaking\":" + String(is_speaker_beeping ? "true" : "false") + ",";
  json += "\"is_speaker_beeping\":" + String(is_speaker_beeping ? "true" : "false") + ",";

  // Telemetry metadata
  json += "\"active_camera\":\"" + active_camera + "\",";
  json += "\"active_event\":\"" + active_event + "\",";
  json += "\"active_action\":\"" + active_action + "\",";
  json += "\"active_profile\":\"" + active_profile + "\"";
  json += "}";
  server.send(200, "application/json", json);
}

void handle_led_on() {
  set_led_locked_on(true);
  server.send(200, "application/json", "{\"status\":\"OK\",\"led_state\":\"on\",\"locked_on\":true}");
}

void handle_led_off() {
  turn_off_led_individual();
  server.send(200, "application/json", "{\"status\":\"OK\",\"led_state\":\"off\",\"locked_on\":false}");
}

void handle_speaker_speak() {
  String cam = server.hasArg("camera") ? server.arg("camera") : "CAM 2";
  String evt = server.hasArg("event") ? server.arg("event") : "Fall / movement detected";
  String act = server.hasArg("action") ? server.arg("action") : "Caregiver alerted";
  String prf = server.hasArg("profile") ? server.arg("profile") : "PROFILE_B";

  active_camera  = cam;
  active_event   = evt;
  active_action  = act;
  active_profile = prf;

  start_speaker_beep(5000);
  server.send(200, "application/json", "{\"status\":\"OK\",\"speaker_state\":\"speaking\",\"duration_sec\":5,\"camera\":\"" + cam + "\"}");
}

void handle_speaker_off() {
  stop_speaker_beep();
  server.send(200, "application/json", "{\"status\":\"OK\",\"speaker_state\":\"idle\"}");
}

void handle_alert() {
  String profile = server.hasArg("profile") ? server.arg("profile") : "PROFILE_B";
  String camera  = server.hasArg("camera")  ? server.arg("camera")  : "CAM 2";
  String event   = server.hasArg("event")   ? server.arg("event")   : "Abnormal movement detected";
  String action  = server.hasArg("action")  ? server.arg("action")  : "Emergency response activated";

  active_camera  = camera;
  active_event   = event;
  active_action  = action;
  active_profile = profile;

  // 1. Emit clean, solid 5-second alert beep on Pin D15
  start_speaker_beep(5000);

  // 2. Trigger Amber LED alert blink for 5000 ms (unless locked on throughout)
  if (!is_led_locked_on) {
    trigger_led_alert_blink(5000);
  }

  String json = "{\"status\":\"ACKNOWLEDGED\",\"camera\":\"" + camera + "\",\"profile\":\"" + profile + "\",\"beeping\":true,\"duration_sec\":5}";
  server.send(200, "application/json", json);
}

void handle_trigger_chime() {
  start_speaker_beep(5000);
  server.send(200, "application/json", "{\"status\":\"DISPATCHED\",\"speaker_state\":\"speaking\",\"duration_sec\":5}");
}

void handle_clear() {
  stop_speaker_beep();
  turn_off_led_individual();
  active_profile = "IDLE";
  active_camera  = "NONE";
  server.send(200, "application/json", "{\"status\":\"CLEARED\",\"led_state\":\"off\",\"speaker_state\":\"idle\"}");
}

void handle_root() {
  String html = "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Ring Compass ESP32 Node</title>";
  html += "<style>body{font-family:-apple-system,sans-serif;background:#0d1117;color:#f0f6fc;padding:30px;line-height:1.6;}";
  html += "h1{color:#10b981;} a.btn{display:inline-block;padding:10px 18px;margin:8px 4px;background:#1b3b2b;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;}";
  html += "a.btn:hover{background:#264e3b;} a.btn-red{background:#b91c1c;} a.btn-amber{background:#d97706;} a.btn-gray{background:#374151;}</style></head><body>";
  html += "<h1>Ring Compass ESP32 Hardware Edge Node</h1>";
  html += "<p><strong>Status:</strong> <span style='color:#10b981;'>ONLINE</span> | <strong>Target IP:</strong> " + WiFi.localIP().toString() + "</p>";
  html += "<p><strong>Pin D15 (GPIO 15):</strong> 5-Second Alert Beep | <strong>Pin D4 (GPIO 4):</strong> Amber Pathway LED</p>";
  html += "<h3>Independent Controls:</h3>";
  html += "<div>";
  html += "<a class='btn btn-amber' href='/led/on'>Turn ON Amber LED (Locked On)</a>";
  html += "<a class='btn btn-gray' href='/led/off'>Turn OFF Amber LED</a>";
  html += "</div><div>";
  html += "<a class='btn' href='/speaker/speak?camera=CAM_2&event=Fall'>Trigger 5s Alert Beep (Speaker Only)</a>";
  html += "<a class='btn btn-gray' href='/speaker/off'>Stop Speaker Beep</a>";
  html += "</div><div>";
  html += "<a class='btn btn-red' href='/alert?profile=PROFILE_B&camera=CAM_2'>Test Full Emergency Alert (5s Beep + Light)</a>";
  html += "<a class='btn btn-gray' href='/clear'>Stop Both</a>";
  html += "</div>";
  html += "<p><a href='/status' style='color:#58a6ff;'>View JSON Status</a></p>";
  html += "</body></html>";
  server.send(200, "text/html", html);
}

// -----------------------------------------------------------------------------
// 7. SETUP
// -----------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(300);

  Serial.println("\n=======================================================");
  Serial.println("  RING COMPASS v2.0 - ESP32 Hardware Edge Node Ready   ");
  Serial.println("  5-Second Alert Beep (D15) & Amber LED (D4) Active   ");
  Serial.println("=======================================================");

  pinMode(PIN_AMBER_LED, OUTPUT);
  pinMode(PIN_STATUS_LED, OUTPUT);
  pinMode(PIN_SPEAKER, OUTPUT);
  pinMode(PIN_BOOT_BTN, INPUT_PULLUP);

  init_speaker();

  // Startup Flash of Amber LED + 200ms confirmation chirp
  digitalWrite(PIN_AMBER_LED, HIGH);
  start_speaker_beep(200);
  delay(200);
  digitalWrite(PIN_AMBER_LED, LOW);

  // Wi-Fi Connection
  Serial.printf("[WIFI] Connecting to SSID: '%s' ...\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.config(staticIP, gateway, subnet, dns);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(400);
    Serial.print(".");
    digitalWrite(PIN_STATUS_LED, !digitalRead(PIN_STATUS_LED));
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(PIN_STATUS_LED, HIGH);
    Serial.println("\n[WIFI] Connected Successfully!");
    Serial.printf("[WIFI] IP Address: http://%s\n", WiFi.localIP().toString().c_str());

    if (MDNS.begin("esp32-chime")) {
      Serial.println("[MDNS] Active: http://esp32-chime.local");
    }

    // Attach REST endpoints for independent and unified control
    server.on("/", HTTP_GET, handle_root);
    server.on("/status", HTTP_GET, handle_status);
    
    // Individual Light Control
    server.on("/led/on", HTTP_ANY, handle_led_on);
    server.on("/led/off", HTTP_ANY, handle_led_off);

    // Individual Speaker Control
    server.on("/speaker/speak", HTTP_ANY, handle_speaker_speak);
    server.on("/speaker/on", HTTP_ANY, handle_speaker_speak);
    server.on("/speaker/off", HTTP_ANY, handle_speaker_off);
    server.on("/speaker/stop", HTTP_ANY, handle_speaker_off);

    // Unified Alerts
    server.on("/alert", HTTP_ANY, handle_alert);
    server.on("/chime", HTTP_ANY, handle_trigger_chime);
    server.on("/clear", HTTP_ANY, handle_clear);

    server.begin();
    Serial.println("[HTTP] REST Service started on port 80.");
  } else {
    Serial.println("\n[WIFI] Connection failed. Running in standalone hardware mode.");
  }
}

// -----------------------------------------------------------------------------
// 8. NON-BLOCKING MAIN LOOP
// -----------------------------------------------------------------------------
void loop() {
  server.handleClient();
  unsigned long now = millis();

  // 1. Independent LED State Handling
  if (is_led_locked_on) {
    digitalWrite(PIN_AMBER_LED, HIGH);
  } else if (is_led_blinking) {
    if (now >= led_auto_off_time) {
      is_led_blinking = false;
      is_led_on = false;
      digitalWrite(PIN_AMBER_LED, LOW);
      digitalWrite(PIN_STATUS_LED, LOW);
      Serial.println("[HARDWARE_LED] Alert blinking duration expired -> Amber LED OFF.");
    } else {
      if (now - led_blink_timer >= 120) {
        led_blink_timer = now;
        led_blink_phase = !led_blink_phase;
        digitalWrite(PIN_AMBER_LED, led_blink_phase ? HIGH : LOW);
        digitalWrite(PIN_STATUS_LED, led_blink_phase ? HIGH : LOW);
      }
    }
  }

  // 2. Non-blocking 5-second beep auto-off
  if (is_speaker_beeping) {
    if (now >= speaker_off_time) {
      stop_speaker_beep();
    }
  }

  // 3. Physical BOOT Button on ESP32 DevKit for instant hardware testing
  if (digitalRead(PIN_BOOT_BTN) == LOW) {
    delay(50);
    if (digitalRead(PIN_BOOT_BTN) == LOW) {
      Serial.println("[MANUAL] BOOT button pressed! Triggering 5-second alert beep & Amber LED...");
      start_speaker_beep(5000);
      if (!is_led_locked_on) {
        trigger_led_alert_blink(5000);
      }
      delay(400);
    }
  }
}
