import fs from "fs";
import path from "path";

function createSimulatedJpegWithExif(lat, lon, outPath) {
  const buffer = Buffer.alloc(1024);
  let pos = 0;

  // SOI
  buffer.writeUInt8(0xff, pos++);
  buffer.writeUInt8(0xd8, pos++);

  // APP1 Marker
  buffer.writeUInt8(0xff, pos++);
  buffer.writeUInt8(0xe1, pos++);

  const app1LengthPos = pos;
  pos += 2; // placeholder for APP1 length

  // Exif\0\0
  buffer.write("Exif\0\0", pos, 6, "latin1");
  pos += 6;

  const tiffBase = pos;

  // TIFF Header: "II" (little-endian), 42, offset to IFD0 = 8
  buffer.write("II", pos, 2, "latin1");
  pos += 2;
  buffer.writeUInt16LE(42, pos);
  pos += 2;
  buffer.writeUInt32LE(8, pos); // IFD0 starts at tiffBase + 8
  pos += 4;

  // IFD0: 1 entry (tag 0x8825)
  buffer.writeUInt16LE(1, pos);
  pos += 2;

  const gpsIfdOffset = 8 + 2 + 12 + 4; // 26 bytes from tiffBase

  // Entry 1: GPSPointer (0x8825), LONG (4), count 1, offset = gpsIfdOffset
  buffer.writeUInt16LE(0x8825, pos); pos += 2;
  buffer.writeUInt16LE(4, pos); pos += 2;
  buffer.writeUInt32LE(1, pos); pos += 4;
  buffer.writeUInt32LE(gpsIfdOffset, pos); pos += 4;

  // IFD0 next offset = 0
  buffer.writeUInt32LE(0, pos);
  pos += 4;

  // GPS IFD at gpsIfdOffset (tiffBase + 26)
  // 4 entries
  buffer.writeUInt16LE(4, pos);
  pos += 2;

  // Tag 1: GPSLatitudeRef 'N'
  buffer.writeUInt16LE(1, pos); pos += 2;
  buffer.writeUInt16LE(2, pos); pos += 2;
  buffer.writeUInt32LE(2, pos); pos += 4;
  buffer.write("N\0\0\0", pos, 4, "latin1"); pos += 4;

  // Tag 2: GPSLatitude (3 rationals = 24 bytes). Let's put rationals after GPS IFD
  const latRationalOffset = gpsIfdOffset + 2 + (4 * 12) + 4;
  buffer.writeUInt16LE(2, pos); pos += 2;
  buffer.writeUInt16LE(5, pos); pos += 2;
  buffer.writeUInt32LE(3, pos); pos += 4;
  buffer.writeUInt32LE(latRationalOffset, pos); pos += 4;

  // Tag 3: GPSLongitudeRef 'E'
  buffer.writeUInt16LE(3, pos); pos += 2;
  buffer.writeUInt16LE(2, pos); pos += 2;
  buffer.writeUInt32LE(2, pos); pos += 4;
  buffer.write("E\0\0\0", pos, 4, "latin1"); pos += 4;

  // Tag 4: GPSLongitude (3 rationals = 24 bytes)
  const lonRationalOffset = latRationalOffset + 24;
  buffer.writeUInt16LE(4, pos); pos += 2;
  buffer.writeUInt16LE(5, pos); pos += 2;
  buffer.writeUInt32LE(3, pos); pos += 4;
  buffer.writeUInt32LE(lonRationalOffset, pos); pos += 4;

  // GPS IFD next offset = 0
  buffer.writeUInt32LE(0, pos);
  pos += 4;

  // Lat rationals (deg, min, sec)
  const latDeg = Math.floor(lat);
  const latMin = Math.floor((lat - latDeg) * 60);
  const latSec = Math.round(((lat - latDeg) * 60 - latMin) * 3600);

  buffer.writeUInt32LE(latDeg, pos); pos += 4;
  buffer.writeUInt32LE(1, pos); pos += 4;
  buffer.writeUInt32LE(latMin, pos); pos += 4;
  buffer.writeUInt32LE(1, pos); pos += 4;
  buffer.writeUInt32LE(latSec, pos); pos += 4;
  buffer.writeUInt32LE(1, pos); pos += 4;

  // Lon rationals (deg, min, sec)
  const lonDeg = Math.floor(lon);
  const lonMin = Math.floor((lon - lonDeg) * 60);
  const lonSec = Math.round(((lon - lonDeg) * 60 - lonMin) * 3600);

  buffer.writeUInt32LE(lonDeg, pos); pos += 4;
  buffer.writeUInt32LE(1, pos); pos += 4;
  buffer.writeUInt32LE(lonMin, pos); pos += 4;
  buffer.writeUInt32LE(1, pos); pos += 4;
  buffer.writeUInt32LE(lonSec, pos); pos += 4;
  buffer.writeUInt32LE(1, pos); pos += 4;

  // Fill APP1 length
  const app1Length = pos - app1LengthPos;
  buffer.writeUInt16BE(app1Length, app1LengthPos);

  // Minimal JPEG image data (SOF0, SOS, EOI)
  buffer.writeUInt8(0xff, pos++); buffer.writeUInt8(0xdb, pos++);
  buffer.writeUInt16BE(67, pos); pos += 2;
  buffer.writeUInt8(0, pos++);
  for (let i = 0; i < 64; i++) buffer.writeUInt8(16, pos++);

  // SOF0 (Baseline DCT 8x8)
  buffer.writeUInt8(0xff, pos++); buffer.writeUInt8(0xc0, pos++);
  buffer.writeUInt16BE(11, pos); pos += 2;
  buffer.writeUInt8(8, pos++); // 8 bit precision
  buffer.writeUInt16BE(8, pos); pos += 2; // height 8
  buffer.writeUInt16BE(8, pos); pos += 2; // width 8
  buffer.writeUInt8(1, pos++); // 1 component (grayscale)
  buffer.writeUInt8(1, pos++); // component id 1
  buffer.writeUInt8(0x11, pos++); // sampling factors 1x1
  buffer.writeUInt8(0, pos++); // Q table 0

  // DHT (Huffman Table)
  buffer.writeUInt8(0xff, pos++); buffer.writeUInt8(0xc4, pos++);
  buffer.writeUInt16BE(28, pos); pos += 2;
  buffer.writeUInt8(0, pos++); // DC table 0
  for (let i = 0; i < 16; i++) buffer.writeUInt8(i === 0 ? 1 : 0, pos++);
  buffer.writeUInt8(0, pos++);
  buffer.writeUInt8(0x10, pos++); // AC table 0
  for (let i = 0; i < 16; i++) buffer.writeUInt8(i === 0 ? 1 : 0, pos++);
  buffer.writeUInt8(0, pos++);

  // SOS (Start of Scan)
  buffer.writeUInt8(0xff, pos++); buffer.writeUInt8(0xda, pos++);
  buffer.writeUInt16BE(8, pos); pos += 2;
  buffer.writeUInt8(1, pos++); // 1 component
  buffer.writeUInt8(1, pos++); // component id 1
  buffer.writeUInt8(0, pos++); // DC/AC table 0/0
  buffer.writeUInt8(0, pos++); // spectral start 0
  buffer.writeUInt8(63, pos++); // spectral end 63
  buffer.writeUInt8(0, pos++); // approx 0

  // Scan data (minimal dummy block)
  buffer.writeUInt8(0x00, pos++);
  buffer.writeUInt8(0x7f, pos++);

  // EOI
  buffer.writeUInt8(0xff, pos++); buffer.writeUInt8(0xd9, pos++);

  const finalBuffer = buffer.subarray(0, pos);
  fs.writeFileSync(outPath, finalBuffer);
  console.log(`Generated ${outPath} (${finalBuffer.length} bytes)`);
}

const dir = path.join(process.cwd(), "public", "samples");
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

createSimulatedJpegWithExif(21.12, 81.34, path.join(dir, "drone_plotA_before.jpg"));
createSimulatedJpegWithExif(21.12, 81.34, path.join(dir, "drone_plotA_after.jpg"));
