#include <WiFi.h>
#define MQTT_MAX_PACKET_SIZE 512
#include <PubSubClient.h>
#include <Wire.h>
#include <Arduino.h>
#include <ArduinoJson.h>
#include <TFT_eSPI.h>
#include <Adafruit_NeoPixel.h>

#define MUX_ADDR 0x70
#define SLAVE_ADDR 0x77
#define NUM_BYTES 10

#define RGB_PIN     38
#define RGB_COUNT   10

Adafruit_NeoPixel rgb(RGB_COUNT, RGB_PIN, NEO_GRB + NEO_KHZ800);


#define SOL0 18
#define SOL1 17
#define SOL2 16
#define SOL3 15
#define SOL4 7
#define SOL5 6

const int solPins[6] = {SOL0, SOL1, SOL2, SOL3, SOL4, SOL5};

#include <time.h>

// ---- NTP ----
const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = 7 * 3600;   // Indonesia WIB (UTC+7)
const int   daylightOffset_sec = 0;

unsigned long lastNtpSync = 0;
const unsigned long NTP_INTERVAL = 900000; // 15 minutes


const char* ssid = "SSID";
const char* password = "password";

const char* mqtt_server = "MQTT_BROKER_IP";
const char* mqtt_user   = "MQTT_USER";
const char* mqtt_pass   = "MQTT_PASS";
WiFiClient espClient;
PubSubClient client(espClient);

unsigned long lastPublish = 0;

TFT_eSPI tft = TFT_eSPI();

#define BG_COLOR      TFT_YELLOW
#define BAR_COLOR     TFT_DARKGREY
#define TEXT_COLOR    TFT_BLACK
#define BAR_TEXT      TFT_WHITE

#define BAR_HEIGHT 24

#define SLOT_COUNT 6

#define SLOT_COLS   2
#define SLOT_ROWS   3

#define SLOT_X0     20              // left column X
#define SLOT_X1     170             // right column X
#define SLOT_Y      (BAR_HEIGHT + 70)

#define SLOT_W      120
#define SLOT_H      30
#define SLOT_GAP_Y  10

#define SLOT_RADIUS 8

#define SLOT_OK_COLOR   TFT_GREEN
#define SLOT_OFF_COLOR  TFT_LIGHTGREY
#define SLOT_TEXT_COLOR TFT_BLACK

int blinkingSlot = -1;
bool blinkState = false;
unsigned long blinkStart = 0;
unsigned long lastBlinkToggle = 0;

#define BLINK_DURATION 10000   // 10 seconds
#define BLINK_INTERVAL 400    // blink speed
#define SLOT_BLINK_COLOR TFT_BLUE


void drawSlot(int index, bool available, float tempC) {
  int col = index % SLOT_COLS;   // 0 or 1
int row = index / SLOT_COLS;   // 0,1,2

int x = (col == 0) ? SLOT_X0 : SLOT_X1;
int y = SLOT_Y + row * (SLOT_H + SLOT_GAP_Y);


  uint16_t bg = available ? SLOT_OK_COLOR : SLOT_OFF_COLOR;

  tft.fillRoundRect(x, y, SLOT_W, SLOT_H, SLOT_RADIUS, bg);
  tft.drawRoundRect(x, y, SLOT_W, SLOT_H, SLOT_RADIUS, TFT_BLACK);

  tft.setTextDatum(MC_DATUM);
  tft.setTextColor(SLOT_TEXT_COLOR, bg);
  tft.setTextSize(1);

  if (available) {
    tft.drawString(
      String(tempC, 1) + " C",
      x + SLOT_W / 2,
      y + SLOT_H / 2
    );
  } else {
    tft.drawString(
      "Slot " + String(index+1) + " Empty",
      x + SLOT_W / 2,
      y + SLOT_H / 2
    );
  }
}

void drawBlinkSlot(int index, bool on) {
  int col = index % SLOT_COLS;
  int row = index / SLOT_COLS;

  int x = (col == 0) ? SLOT_X0 : SLOT_X1;
  int y = SLOT_Y + row * (SLOT_H + SLOT_GAP_Y);

  uint16_t bg = on ? SLOT_BLINK_COLOR : SLOT_OFF_COLOR;

  tft.fillRoundRect(x, y, SLOT_W, SLOT_H, SLOT_RADIUS, bg);
  tft.drawRoundRect(x, y, SLOT_W, SLOT_H, SLOT_RADIUS, TFT_BLACK);

  tft.setTextDatum(MC_DATUM);
  tft.setTextColor(TFT_WHITE, bg);
  tft.setTextSize(1);
  tft.drawString("OPENING...", x + SLOT_W / 2, y + SLOT_H / 2);
}


String getTimeStr() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    return "--:--";
  }

  char buf[6];
  strftime(buf, sizeof(buf), "%H:%M", &timeinfo);
  return String(buf);
}


void initNTP() {
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);

  Serial.print("Syncing NTP");
  struct tm timeinfo;
  while (!getLocalTime(&timeinfo)) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\nNTP time synced");
}

uint32_t wheel(byte pos) {
  pos = 255 - pos;
  if (pos < 85) {
    return rgb.Color(255 - pos * 3, 0, pos * 3);
  }
  if (pos < 170) {
    pos -= 85;
    return rgb.Color(0, pos * 3, 255 - pos * 3);
  }
  pos -= 170;
  return rgb.Color(pos * 3, 255 - pos * 3, 0);
}

void rainbowCycle() {
  static uint8_t hue = 0;

  for (int i = 0; i < RGB_COUNT; i++) {
    rgb.setPixelColor(i, wheel((i * 256 / RGB_COUNT + hue) & 255));
  }

  rgb.show();
  hue++;
}

void drawBaseUI() {
  tft.fillScreen(BG_COLOR);

  // Notification bar
  tft.fillRect(0, 0, tft.width(), BAR_HEIGHT, BAR_COLOR);

  // Title text
  tft.setTextColor(TEXT_COLOR, BG_COLOR);
  tft.setTextDatum(MC_DATUM);
  tft.setTextSize(2);
  tft.drawString("powerdock", tft.width() / 2, BAR_HEIGHT + 30);

  for (int i = 0; i < SLOT_COUNT; i++) {
  drawSlot(i, false, 0);
}

}

void updateStatusBar() {
  tft.fillRect(0, 0, tft.width(), BAR_HEIGHT, BAR_COLOR);

  tft.setTextColor(BAR_TEXT, BAR_COLOR);
  tft.setTextSize(1);
  tft.setTextDatum(ML_DATUM);

  // Time (left)
  tft.drawString(getTimeStr(), 5, BAR_HEIGHT / 2);

  // WiFi status (right)
  tft.setTextDatum(MR_DATUM);
  if (WiFi.status() == WL_CONNECTED) {
    tft.drawString("WiFi OK", tft.width() - 5, BAR_HEIGHT / 2);
  } else {
    tft.drawString("WiFi OFF", tft.width() - 5, BAR_HEIGHT / 2);
  }
}


void selectMuxChannel(uint8_t channel) {
  if (channel > 7) return;
  Wire.beginTransmission(MUX_ADDR);
  Wire.write(1 << channel);
  Wire.endTransmission();
  delay(2);
}

String getChipID() {
  uint64_t chipID = ESP.getEfuseMac();
  char idStr[17];
  sprintf(idStr, "%04X%08X", (uint16_t)(chipID>>32), (uint32_t)chipID);
  return String(idStr);
}

float getCpuTemp() {
  return temperatureRead();
}

void callback(char* topic, byte* payload, unsigned int length) {
  StaticJsonDocument<200> doc;
  DeserializationError error = deserializeJson(doc, payload, length);
  if (error) {
    Serial.print("deserializeJson() failed: ");
    Serial.println(error.c_str());
    return;
  }

  String station_id = doc["station_id"].as<String>();
  int slot = doc["slot"].as<int>();

  Serial.print("Received station_id: "); Serial.println(station_id);
  Serial.print("Slot: "); Serial.println(slot);

  // Check if station_id matches ESP chipID
if (station_id == getChipID()) {
  if (slot >= 0 && slot < 6) {

    blinkingSlot = slot;
    blinkStart = millis();
    lastBlinkToggle = 0;
    blinkState = true;

    digitalWrite(solPins[slot], HIGH);
  }
}

}

void setupWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
  Serial.println(WiFi.localIP());
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");
    if (client.connect("esp32-client", mqtt_user, mqtt_pass)) {
      Serial.println("connected");
      client.subscribe("powerdock/open"); // Subscribe here
    } else {
      Serial.print("failed (");
      Serial.print(client.state());
      Serial.println("). Retrying...");
      delay(2000);
    }
  }
}

void setup() {
  for (int i = 0; i < 6; i++) pinMode(solPins[i], OUTPUT);

  Serial.begin(115200);

  rgb.begin();
  rgb.setBrightness(80);   // adjust 0–255
  rgb.clear();
  rgb.show();


  tft.init();
  tft.setRotation(3);
  drawBaseUI();

  Wire.begin(47, 48);  
  Wire.setClock(80000);

  setupWiFi();
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
  initNTP();

  Serial.println("ESP I2C + MQTT Ready");
}

void loop() {
  static bool slotDetected[6];
  static float slotTemp[6];

  if (millis() - lastNtpSync > NTP_INTERVAL) {
  lastNtpSync = millis();
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  Serial.println("NTP re-synced");
}

// ---- Slot blinking handler ----
if (blinkingSlot != -1) {

  // Toggle blink
  if (millis() - lastBlinkToggle > BLINK_INTERVAL) {
    lastBlinkToggle = millis();
    blinkState = !blinkState;
    drawBlinkSlot(blinkingSlot, blinkState);
  }

  // Stop blinking after duration
  if (millis() - blinkStart > BLINK_DURATION) {
    digitalWrite(solPins[blinkingSlot], LOW);

    // Redraw slot back to normal
    drawSlot(
      blinkingSlot,
      false,   // availability will refresh on next sensor scan
      0
    );

    blinkingSlot = -1;
  }
}


static unsigned long lastRGB = 0;
if (millis() - lastRGB > 30) {   // smooth rainbow
  lastRGB = millis();
  rainbowCycle();
}


  static unsigned long lastUI = 0;
if (millis() - lastUI > 1000) {   // update every 1s
  lastUI = millis();
  updateStatusBar();
}

  if (!client.connected()) reconnect();
  client.loop();

  // ---- every 5 seconds publish data ----
  if (millis() - lastPublish >= 5000) {
    lastPublish = millis();

    StaticJsonDocument<500> doc;

    doc["uid"] = getChipID();
    doc["cpu_temp"] = getCpuTemp();

    JsonArray arr = doc.createNestedArray("channels");

    for (int i = 0; i < 6; i++) {
  slotDetected[i] = false;
}


    for (uint8_t ch = 0; ch < 8; ch++) {
      selectMuxChannel(ch);
      Wire.beginTransmission(SLAVE_ADDR);
      uint8_t error = Wire.endTransmission(true);

      if (error == 0) {
        uint8_t data[NUM_BYTES] = {0};
        Wire.requestFrom(SLAVE_ADDR, NUM_BYTES);
        int i = 0;
        while (Wire.available() && i < NUM_BYTES) data[i++] = Wire.read();

        char uidStr[17];
        for (int i = 0; i < 8; i++) sprintf(&uidStr[i * 2], "%02X", data[i]);

        uint16_t adcValue = (data[9] << 8) | data[8];
        float Vout = (adcValue / 1023.0) * 3.3;
        float Rntc = 100000.0 * (Vout / (3.3 - Vout));
        float Tkelvin = 1.0 / ( (1.0/298.15) + (1.0/3950.0) * log(Rntc / 100000.0) );
        float Tc = Tkelvin - 273.15;

        JsonObject o = arr.createNestedObject();
        o["channel"] = ch;
        o["powerbank_id"] = uidStr;
        o["tempC"] = Tc;

        if (ch < 6) {
        slotDetected[ch] = true;
        slotTemp[ch] = Tc;
}

      }
    }
    for (int i = 0; i < 6; i++) {
  drawSlot(i, slotDetected[i], slotTemp[i]);
}

    char jsonBuffer[500];
    serializeJson(doc, jsonBuffer);
    client.publish("powerdock/data", jsonBuffer);
    Serial.println("Published:");
    Serial.println(jsonBuffer);
  }
}
