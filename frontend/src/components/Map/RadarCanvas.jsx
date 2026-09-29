/**
 * Radar reflectivity color scale (meteorological standard)
 * Returns [R, G, B, alpha] for a given dBZ value.
 * Based on NWS/IMD standard color tables.
 */
export function dbzToColor(dbz) {
  if (dbz <= 0)  return [0, 0, 0, 0];
  if (dbz < 10)  return [160, 240, 255, 0.12];   // very light blue — near noise floor
  if (dbz < 15)  return [100, 200, 255, 0.25];   // light blue
  if (dbz < 20)  return [0,   160, 255, 0.40];   // sky blue
  if (dbz < 25)  return [0,   220, 180, 0.50];   // cyan-green
  if (dbz < 30)  return [0,   210,  0,  0.58];   // green
  if (dbz < 35)  return [0,   180,  0,  0.65];   // dark green
  if (dbz < 40)  return [255, 255,  0,  0.72];   // yellow
  if (dbz < 45)  return [255, 200,  0,  0.78];   // amber
  if (dbz < 50)  return [255, 136,  0,  0.82];   // orange
  if (dbz < 55)  return [255,  60,  0,  0.86];   // orange-red
  if (dbz < 60)  return [220,   0,  0,  0.88];   // red
  if (dbz < 65)  return [160,   0, 220, 0.90];   // purple
  return           [204,   0, 255, 0.92];         // deep purple — extreme
}
