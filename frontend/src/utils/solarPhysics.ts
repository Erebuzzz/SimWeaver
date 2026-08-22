/**
 * Solar Physics and Real-Time Lighting Engine for SimWeaver
 *
 * Calculates real-world solar elevation, azimuth, physical shadows, and ambient
 * lighting vectors anchored to Indian Standard Time (IST / UTC+5:30).
 */
export interface SolarCoordinates {
  istTimeString: string;
  elevationDeg: number;
  azimuthDeg: number;
  isDaytime: boolean;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowBlur: number;
  shadowOpacity: number;
  lightVector3D: [number, number, number];
  sunColorHex: string;
  ambientIntensity: number;
  phaseLabel: string;
}

const INDIA_LATITUDE_DEG = 20.5937; // Reference central latitude

export function calculateISTSolarPhysics(customDate?: Date): SolarCoordinates {
  // Current UTC time converted to IST (UTC + 5 hours 30 mins)
  const nowUtc = customDate || new Date();
  const utcMillis = nowUtc.getTime() + nowUtc.getTimezoneOffset() * 60000;
  const istMillis = utcMillis + 5.5 * 3600000;
  const istDate = new Date(istMillis);

  const hours = istDate.getHours();
  const minutes = istDate.getMinutes();
  const seconds = istDate.getSeconds();
  const decimalHours = hours + minutes / 60.0 + seconds / 3600.0;

  const startOfYear = new Date(istDate.getFullYear(), 0, 0);
  const diff = istDate.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  // Solar declination calculation
  const declinationRad =
    ((-23.44 * Math.PI) / 180.0) *
    Math.cos(((2 * Math.PI) / 365.0) * (dayOfYear + 10));

  const latRad = (INDIA_LATITUDE_DEG * Math.PI) / 180.0;
  // Hour angle (15 deg per hour from solar noon)
  const hourAngleRad = (((decimalHours - 12.0) * 15.0) * Math.PI) / 180.0;

  // Solar elevation alpha
  const sinElevation =
    Math.sin(latRad) * Math.sin(declinationRad) +
    Math.cos(latRad) * Math.cos(declinationRad) * Math.cos(hourAngleRad);
  const elevationRad = Math.asin(Math.max(-1.0, Math.min(1.0, sinElevation)));
  const elevationDeg = (elevationRad * 180.0) / Math.PI;

  // Solar azimuth theta
  const cosAzimuth =
    (Math.sin(declinationRad) - Math.sin(latRad) * Math.sin(elevationRad)) /
    (Math.cos(latRad) * Math.cos(elevationRad) + 1e-6);
  let azimuthRad = Math.acos(Math.max(-1.0, Math.min(1.0, cosAzimuth)));
  if (hourAngleRad > 0) {
    azimuthRad = 2 * Math.PI - azimuthRad;
  }
  const azimuthDeg = (azimuthRad * 180.0) / Math.PI;

  const isDaytime = elevationDeg > 0;

  // Physical shadow projection calculation
  // Shadow points opposite to sun azimuth
  const shadowAngleRad = azimuthRad + Math.PI;
  const effectiveElevation = Math.max(10.0, Math.abs(elevationDeg));
  const shadowLengthFactor = Math.min(
    2.5,
    1.0 / Math.tan((effectiveElevation * Math.PI) / 180.0)
  );

  const shadowDist = 8.0 * shadowLengthFactor;
  const shadowOffsetX = Math.sin(shadowAngleRad) * shadowDist;
  const shadowOffsetY = Math.cos(shadowAngleRad) * shadowDist;
  const shadowBlur = Math.max(8.0, 14.0 * shadowLengthFactor);
  const shadowOpacity = isDaytime ? 0.35 : 0.65;

  // 3D Directional Light Vector in Three.js Coordinates (Y is Up)
  const lightRadius = 40.0;
  const lightY = Math.max(8.0, Math.sin(Math.max(0.15, elevationRad)) * lightRadius);
  const lightX = Math.sin(azimuthRad) * Math.cos(Math.max(0.15, elevationRad)) * lightRadius;
  const lightZ = Math.cos(azimuthRad) * Math.cos(Math.max(0.15, elevationRad)) * lightRadius;

  // Color & Intensity Calculation
  let sunColorHex = '#F8FAFC';
  let ambientIntensity = 0.6;
  let phaseLabel = 'Daylight';

  if (elevationDeg > 35) {
    sunColorHex = '#FFFFFF';
    ambientIntensity = 0.85;
    phaseLabel = 'High Noon Solar';
  } else if (elevationDeg > 5) {
    sunColorHex = '#FED7AA'; // Warm golden sunlight
    ambientIntensity = 0.7;
    phaseLabel = 'Golden Solar Horizon';
  } else if (elevationDeg > -6) {
    sunColorHex = '#C4B5FD'; // Twilight purple/amber
    ambientIntensity = 0.5;
    phaseLabel = 'Twilight Horizon';
  } else {
    sunColorHex = '#93C5FD'; // Lunar specular night
    ambientIntensity = 0.38;
    phaseLabel = 'Night Lunar Specular';
  }

  const istTimeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} IST`;

  return {
    istTimeString,
    elevationDeg,
    azimuthDeg,
    isDaytime,
    shadowOffsetX,
    shadowOffsetY,
    shadowBlur,
    shadowOpacity,
    lightVector3D: [lightX, lightY, lightZ],
    sunColorHex,
    ambientIntensity,
    phaseLabel,
  };
}

export function applySolarCSSVariables(coords: SolarCoordinates, isDarkMode: boolean): void {
  const root = document.documentElement;
  root.style.setProperty('--sun-shadow-x', `${coords.shadowOffsetX.toFixed(1)}px`);
  root.style.setProperty('--sun-shadow-y', `${coords.shadowOffsetY.toFixed(1)}px`);
  root.style.setProperty('--sun-shadow-blur', `${coords.shadowBlur.toFixed(1)}px`);
  
  const opacity = isDarkMode ? coords.shadowOpacity * 0.9 : coords.shadowOpacity * 0.45;
  root.style.setProperty('--sun-shadow-opacity', opacity.toFixed(2));
  root.style.setProperty('--sun-azimuth-deg', `${coords.azimuthDeg.toFixed(1)}deg`);
  root.style.setProperty('--sun-elevation-deg', `${coords.elevationDeg.toFixed(1)}deg`);
}
