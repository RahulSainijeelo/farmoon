type ExifLocation = { latitude?: number; longitude?: number; capturedAt?: string };

function readAscii(view: DataView, offset: number, count: number): string {
  let value = "";
  for (let index = 0; index < count; index += 1) {
    const char = view.getUint8(offset + index);
    if (char === 0) break;
    value += String.fromCharCode(char);
  }
  return value;
}

function readRationals(view: DataView, base: number, offset: number, count: number, littleEndian: boolean): number[] {
  const absolute = base + offset;
  return Array.from({ length: count }, (_, index) => {
    const numerator = view.getUint32(absolute + index * 8, littleEndian);
    const denominator = view.getUint32(absolute + index * 8 + 4, littleEndian);
    return denominator === 0 ? 0 : numerator / denominator;
  });
}

function directory(view: DataView, base: number, offset: number, littleEndian: boolean): Map<number, { type: number; count: number; valueOffset: number; inlineOffset: number }> {
  const values = new Map<number, { type: number; count: number; valueOffset: number; inlineOffset: number }>();
  const start = base + offset;
  if (start + 2 > view.byteLength) return values;
  const count = view.getUint16(start, littleEndian);
  for (let index = 0; index < count; index += 1) {
    const entry = start + 2 + index * 12;
    if (entry + 12 > view.byteLength) break;
    const tag = view.getUint16(entry, littleEndian);
    const type = view.getUint16(entry + 2, littleEndian);
    const itemCount = view.getUint32(entry + 4, littleEndian);
    const valueOffset = view.getUint32(entry + 8, littleEndian);
    values.set(tag, { type, count: itemCount, valueOffset, inlineOffset: entry + 8 });
  }
  return values;
}

export function readJpegExif(bytes: ArrayBuffer): ExifLocation {
  const view = new DataView(bytes);
  const result: ExifLocation = {};
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return result;

  let cursor = 2;
  while (cursor + 4 < view.byteLength) {
    if (view.getUint8(cursor) !== 0xff) break;
    const marker = view.getUint8(cursor + 1);
    const segmentLength = view.getUint16(cursor + 2);
    const segment = cursor + 4;
    if (segmentLength < 2 || segment + segmentLength - 2 > view.byteLength) break;
    if (marker === 0xe1 && readAscii(view, segment, 6) === "Exif\0\0") {
      const base = segment + 6;
      const order = readAscii(view, base, 2);
      const littleEndian = order === "II";
      if ((!littleEndian && order !== "MM") || view.getUint16(base + 2, littleEndian) !== 42) return result;
      const firstOffset = view.getUint32(base + 4, littleEndian);
      const ifd0 = directory(view, base, firstOffset, littleEndian);
      const exifPointer = ifd0.get(0x8769)?.valueOffset;
      if (exifPointer) {
        const exifIfd = directory(view, base, exifPointer, littleEndian);
        const dateEntry = exifIfd.get(0x9003);
        if (dateEntry?.count && dateEntry.type === 2) {
          result.capturedAt = readAscii(view, base + dateEntry.valueOffset, dateEntry.count).replace(/^([0-9]{4}):([0-9]{2}):([0-9]{2})/, "$1-$2-$3");
        }
      }
      const gpsPointer = ifd0.get(0x8825)?.valueOffset;
      if (gpsPointer) {
        const gps = directory(view, base, gpsPointer, littleEndian);
        const readRef = (tag: number) => {
          const entry = gps.get(tag);
          if (!entry || entry.type !== 2) return "";
          return readAscii(view, entry.inlineOffset, Math.min(entry.count, 4));
        };
        const readCoordinates = (tag: number) => {
          const entry = gps.get(tag);
          if (!entry || entry.type !== 5 || entry.count < 3) return undefined;
          const values = readRationals(view, base, entry.valueOffset, 3, littleEndian);
          return values[0] + values[1] / 60 + values[2] / 3600;
        };
        const lat = readCoordinates(2);
        const lon = readCoordinates(4);
        if (lat !== undefined && lon !== undefined) {
          result.latitude = readRef(1).toUpperCase() === "S" ? -lat : lat;
          result.longitude = readRef(3).toUpperCase() === "W" ? -lon : lon;
        }
      }
      return result;
    }
    cursor = segment + segmentLength - 2;
    if (marker === 0xda || marker === 0xd9) break;
  }
  return result;
}
