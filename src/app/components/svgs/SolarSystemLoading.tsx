'use client';
import React, { useEffect, useRef } from 'react';

const planetsData = [
  {
    orbitRx: 40,
    planetRadius: 4,
    orbitDuration: 4000,
    initialAngle: 0,
    tiltDuration: 5000,
    orbitAnimationDelay: 0,
    pulseDuration: 3200,
    tiltModDuration: 13000,
    pulseModDuration: 11000,
    orbitRotDuration: 25000,
  },
  {
    orbitRx: 75,
    planetRadius: 6,
    orbitDuration: 7000,
    initialAngle: 120,
    tiltDuration: 6000,
    orbitAnimationDelay: -1500,
    pulseDuration: 5600,
    tiltModDuration: 15000,
    pulseModDuration: 12000,
    orbitRotDuration: 30000,
  },
  {
    orbitRx: 110,
    planetRadius: 8,
    orbitDuration: 11000,
    initialAngle: 240,
    tiltDuration: 7000,
    orbitAnimationDelay: -3000,
    pulseDuration: 8800,
    tiltModDuration: 17000,
    pulseModDuration: 13000,
    orbitRotDuration: 35000,
  },
];

const CENTER_X = 150;
const CENTER_Y = 150;
const VIEW_BOX_SIZE = 300;

const BASE_TILT_FACTOR = 0.5;
const TILT_VARIATION = 0.1;
const BASE_PULSE_FACTOR = 1.2;
const PULSE_VARIATION = 0.15;
const ORBIT_ROTATION_MAX = 15;

const SolarSystemLoading: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  const { className, width = 64, height = 64, ...rest } = props;

  const svgRef = useRef<SVGSVGElement>(null);
  const orbitRefs = useRef<(SVGEllipseElement | null)[]>([]);
  const planetRefs = useRef<(SVGCircleElement | null)[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    orbitRefs.current = orbitRefs.current.slice(0, planetsData.length);
    planetRefs.current = planetRefs.current.slice(0, planetsData.length);

    const animate = (timestamp: number) => {
      if (startTimeRef.current === undefined) {
        startTimeRef.current = timestamp;
      }
      const elapsed = timestamp - startTimeRef.current;

      planetsData.forEach((planet, index) => {
        const orbitElement = orbitRefs.current[index];
        const planetElement = planetRefs.current[index];

        if (!orbitElement || !planetElement) return;

        // --- Dynamic Tilt Factor ---
        const tiltModProgress =
          (elapsed % planet.tiltModDuration) / planet.tiltModDuration;
        const tiltModValue = Math.sin(tiltModProgress * 2 * Math.PI);
        const currentTiltFactor =
          BASE_TILT_FACTOR + tiltModValue * TILT_VARIATION;

        // --- Animate Orbit Tilt (ry) ---
        const tiltTime = elapsed + planet.orbitAnimationDelay;
        const tiltProgress =
          (tiltTime % planet.tiltDuration) / planet.tiltDuration;
        const tiltEase = (1 - Math.cos(tiltProgress * 2 * Math.PI)) / 2;
        const maxRy = planet.orbitRx;
        const minRy = planet.orbitRx * currentTiltFactor;
        const currentRy = minRy + (maxRy - minRy) * tiltEase;
        orbitElement.setAttribute('ry', currentRy.toString());

        // --- Animate Subtle Orbit Rotation ---
        const orbitRotProgress =
          (elapsed % planet.orbitRotDuration) / planet.orbitRotDuration;
        const currentOrbitRotation =
          Math.sin(orbitRotProgress * 2 * Math.PI) * ORBIT_ROTATION_MAX;
        orbitElement.setAttribute(
          'transform',
          `rotate(${currentOrbitRotation} ${CENTER_X} ${CENTER_Y})`
        );

        // --- Animate Planet Position ---
        const orbitProgress =
          (elapsed % planet.orbitDuration) / planet.orbitDuration;
        const initialAngleRad = (planet.initialAngle * Math.PI) / 180;
        const currentAngleRad = initialAngleRad + orbitProgress * 2 * Math.PI;

        const xOnEllipse = planet.orbitRx * Math.cos(currentAngleRad);
        const yOnEllipse = currentRy * Math.sin(currentAngleRad);
        const orbitRotRad = (currentOrbitRotation * Math.PI) / 180;
        const cosRot = Math.cos(orbitRotRad);
        const sinRot = Math.sin(orbitRotRad);
        const planetX = CENTER_X + (xOnEllipse * cosRot - yOnEllipse * sinRot);
        const planetY = CENTER_Y + (xOnEllipse * sinRot + yOnEllipse * cosRot);

        planetElement.setAttribute('cx', planetX.toString());
        planetElement.setAttribute('cy', planetY.toString());

        // --- Dynamic Pulse Factor ---
        const pulseModProgress =
          (elapsed % planet.pulseModDuration) / planet.pulseModDuration;
        const pulseModValue =
          (1 + Math.sin(pulseModProgress * 2 * Math.PI)) / 2;
        const currentPulseFactor =
          BASE_PULSE_FACTOR -
          PULSE_VARIATION +
          pulseModValue * 2 * PULSE_VARIATION;

        // --- Animate Planet Pulse (r) ---
        const pulseTime = elapsed;
        const pulseProgress =
          (pulseTime % planet.pulseDuration) / planet.pulseDuration;
        const pulseEase = (1 - Math.cos(pulseProgress * 2 * Math.PI)) / 2;
        const maxR = planet.planetRadius * currentPulseFactor;
        const minR = planet.planetRadius;
        const currentR = minR + (maxR - minR) * pulseEase;
        planetElement.setAttribute('r', currentR.toString());
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      startTimeRef.current = undefined;
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      xmlns='http://www.w3.org/2000/svg'
      viewBox={`0 0 ${VIEW_BOX_SIZE} ${VIEW_BOX_SIZE}`}
      width={width}
      height={height}
      // Apply className here. It should contain text color utilities.
      // Example: className="text-black dark:text-white"
      className={className}
      preserveAspectRatio='xMidYMid meet'
      aria-busy='true'
      role='progressbar'
      aria-live='polite'
      {...rest}
    >
      <title>Loading Animation</title>
      <desc>
        Dynamic stylized animation of orbiting, pulsing planets with varying
        tilt.
      </desc>

      {/* Central "Sun" - Use currentColor */}
      <circle
        cx={CENTER_X}
        cy={CENTER_Y}
        r='12'
        fill='currentColor' // Changed from #FFFFFF
      />

      {/* Render orbits - Fixed faint stroke */}
      {planetsData.map((planet, index) => (
        <ellipse
          key={`orbit-${index}`}
          ref={(el) => {
            orbitRefs.current[index] = el;
          }}
          cx={CENTER_X}
          cy={CENTER_Y}
          rx={planet.orbitRx}
          ry={planet.orbitRx}
          fill='none'
          stroke='rgba(128, 128, 128, .7)' // Slightly darker faint stroke
          strokeWidth='1'
          strokeDasharray='4 4'
          transform={`rotate(0 ${CENTER_X} ${CENTER_Y})`}
        />
      ))}

      {/* Render Planets - Use currentColor */}
      {planetsData.map((planet, index) => (
        <circle
          key={`planet-${index}`}
          ref={(el) => {
            planetRefs.current[index] = el;
          }}
          cx={CENTER_X}
          cy={CENTER_Y}
          r={planet.planetRadius}
          fill='currentColor' // Changed from planet.color
        />
      ))}
    </svg>
  );
};

export default SolarSystemLoading;
