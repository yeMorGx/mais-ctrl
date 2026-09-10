import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

interface AndroidPhoneMockupProps {
  className?: string;
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.arcTo(x + width, y, x + width, y + height, safeRadius);
  context.arcTo(x + width, y + height, x, y + height, safeRadius);
  context.arcTo(x, y + height, x, y, safeRadius);
  context.arcTo(x, y, x + width, y, safeRadius);
  context.closePath();
}

function createScreenTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 1200;

  const context = canvas.getContext("2d");
  if (!context) return null;

  const background = context.createLinearGradient(0, 0, 0, canvas.height);
  background.addColorStop(0, "#18181b");
  background.addColorStop(1, "#0b0b0d");
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "#f7f7f8";
  context.font = "600 22px Arial, sans-serif";
  context.fillText("9:41", 34, 48);
  context.fillStyle = "rgba(247, 247, 248, 0.58)";
  context.font = "500 18px Arial, sans-serif";
  context.fillText("●  ▪  ▰", 492, 48);

  context.fillStyle = "rgba(255, 255, 255, 0.58)";
  context.font = "500 22px Arial, sans-serif";
  context.fillText("Olá, Gabriel", 34, 128);
  context.fillStyle = "#ffffff";
  context.font = "800 42px Arial, sans-serif";
  context.fillText("Visão geral", 34, 178);

  const summaryGradient = context.createLinearGradient(34, 226, 566, 510);
  summaryGradient.addColorStop(0, "#7c3aed");
  summaryGradient.addColorStop(1, "#4c1d95");
  roundedRect(context, 34, 226, 532, 284, 30);
  context.fillStyle = summaryGradient;
  context.fill();
  context.fillStyle = "rgba(255, 255, 255, 0.7)";
  context.font = "600 20px Arial, sans-serif";
  context.fillText("Gastos este mês", 68, 280);
  context.fillStyle = "#ffffff";
  context.font = "800 56px Arial, sans-serif";
  context.fillText("R$ 1.248,90", 68, 356);
  context.fillStyle = "rgba(255, 255, 255, 0.68)";
  context.font = "500 18px Arial, sans-serif";
  context.fillText("↓ 8,4% em relação ao mês passado", 68, 410);

  context.strokeStyle = "rgba(255, 255, 255, 0.34)";
  context.lineWidth = 5;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(72, 462);
  context.bezierCurveTo(160, 432, 190, 476, 262, 446);
  context.bezierCurveTo(330, 418, 376, 458, 438, 424);
  context.bezierCurveTo(488, 396, 516, 408, 538, 382);
  context.stroke();

  context.fillStyle = "#f7f7f8";
  context.font = "800 28px Arial, sans-serif";
  context.fillText("Próximos pagamentos", 34, 596);

  const payments = [
    { name: "Netflix", value: "R$ 55,90", color: "#e50914", day: "Hoje" },
    { name: "Spotify", value: "R$ 21,90", color: "#1ed760", day: "Amanhã" },
    { name: "Adobe Creative Cloud", value: "R$ 124,00", color: "#ff4b26", day: "18 Jun" },
  ];

  payments.forEach((payment, index) => {
    const y = 632 + index * 122;
    roundedRect(context, 34, y, 532, 94, 22);
    context.fillStyle = "#202024";
    context.fill();
    context.fillStyle = payment.color;
    roundedRect(context, 56, y + 22, 50, 50, 15);
    context.fill();
    context.fillStyle = "#ffffff";
    context.font = "700 20px Arial, sans-serif";
    context.fillText(payment.name, 130, y + 42);
    context.fillStyle = "rgba(247, 247, 248, 0.52)";
    context.font = "500 17px Arial, sans-serif";
    context.fillText(payment.day, 130, y + 69);
    context.fillStyle = "#ffffff";
    context.font = "700 19px Arial, sans-serif";
    context.textAlign = "right";
    context.fillText(payment.value, 536, y + 56);
    context.textAlign = "left";
  });

  roundedRect(context, 34, 1020, 532, 94, 22);
  context.fillStyle = "#202024";
  context.fill();
  context.fillStyle = "#a78bfa";
  context.font = "700 22px Arial, sans-serif";
  context.fillText("+", 62, 1079);
  context.fillStyle = "#ffffff";
  context.font = "700 19px Arial, sans-serif";
  context.fillText("Adicionar assinatura", 106, 1078);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

export function AndroidPhoneMockup({ className = "" }: AndroidPhoneMockupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch {
      setWebglUnavailable(true);
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
    camera.position.set(0, 0.05, 13.2);
    camera.lookAt(0, 0, 0);

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    scene.add(new THREE.HemisphereLight(0xf8f7ff, 0x18181b, 2.3));

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.6);
    keyLight.position.set(-4, 5, 8);
    scene.add(keyLight);

    const violetLight = new THREE.PointLight(0x8b5cf6, 22, 10, 2);
    violetLight.position.set(3.2, -0.8, 3.5);
    scene.add(violetLight);

    const phone = new THREE.Group();
    phone.rotation.set(-0.05, -0.38, 0.035);
    scene.add(phone);

    const bodyGeometry = new RoundedBoxGeometry(2.9, 5.8, 0.3, 8, 0.16);
    const bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x111114,
      metalness: 0.78,
      roughness: 0.22,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    phone.add(body);

    const rimGeometry = new THREE.EdgesGeometry(bodyGeometry, 24);
    const rim = new THREE.LineSegments(
      rimGeometry,
      new THREE.LineBasicMaterial({ color: 0x5e5e66, transparent: true, opacity: 0.62 }),
    );
    phone.add(rim);

    const screenFrame = new THREE.Mesh(
      new RoundedBoxGeometry(2.65, 5.48, 0.055, 8, 0.17),
      new THREE.MeshPhysicalMaterial({ color: 0x050507, metalness: 0.18, roughness: 0.16, clearcoat: 1 }),
    );
    screenFrame.position.z = 0.17;
    phone.add(screenFrame);

    const screenTexture = createScreenTexture();
    const screen = new THREE.Mesh(
      new RoundedBoxGeometry(2.5, 5.33, 0.035, 8, 0.14),
      new THREE.MeshBasicMaterial({ color: 0xffffff, map: screenTexture ?? undefined }),
    );
    screen.position.z = 0.205;
    phone.add(screen);

    const glass = new THREE.Mesh(
      new RoundedBoxGeometry(2.52, 5.35, 0.018, 8, 0.14),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.11,
        roughness: 0.04,
        transmission: 0.12,
        clearcoat: 1,
      }),
    );
    glass.position.z = 0.235;
    phone.add(glass);

    const cameraPill = new THREE.Mesh(
      new RoundedBoxGeometry(0.62, 0.16, 0.055, 6, 0.08),
      new THREE.MeshBasicMaterial({ color: 0x050507 }),
    );
    cameraPill.position.set(0, 2.45, 0.255);
    phone.add(cameraPill);

    const cameraLens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 0.015, 20),
      new THREE.MeshPhysicalMaterial({ color: 0x1e1b4b, metalness: 0.6, roughness: 0.14, clearcoat: 1 }),
    );
    cameraLens.rotation.x = Math.PI / 2;
    cameraLens.position.set(0.13, 2.45, 0.29);
    phone.add(cameraLens);

    const buttonMaterial = new THREE.MeshPhysicalMaterial({ color: 0x2d2d33, metalness: 0.72, roughness: 0.28 });
    const volumeButtons = new THREE.Mesh(
      new RoundedBoxGeometry(0.08, 0.68, 0.08, 4, 0.03),
      buttonMaterial,
    );
    volumeButtons.position.set(-1.5, 1.26, 0);
    phone.add(volumeButtons);

    const powerButton = new THREE.Mesh(
      new RoundedBoxGeometry(0.08, 0.44, 0.08, 4, 0.03),
      buttonMaterial,
    );
    powerButton.position.set(1.5, 1.16, 0);
    phone.add(powerButton);

    const clock = new THREE.Clock();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let pointerX = 0;
    let pointerY = 0;
    let animationFrame = 0;

    const onPointerMove = (event: PointerEvent) => {
      const bounds = container.getBoundingClientRect();
      pointerX = THREE.MathUtils.clamp(((event.clientX - bounds.left) / bounds.width - 0.5) * 2, -1, 1);
      pointerY = THREE.MathUtils.clamp(((event.clientY - bounds.top) / bounds.height - 0.5) * 2, -1, 1);
    };
    const onPointerLeave = () => {
      pointerX = 0;
      pointerY = 0;
    };
    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerleave", onPointerLeave);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    const animate = () => {
      const elapsed = clock.getElapsedTime();
      if (!reducedMotion) {
        phone.position.y = Math.sin(elapsed * 1.15) * 0.1;
        phone.rotation.x = THREE.MathUtils.lerp(phone.rotation.x, -0.05 + pointerY * 0.08, 0.05);
        phone.rotation.y = THREE.MathUtils.lerp(phone.rotation.y, -0.38 + pointerX * 0.18, 0.05);
        phone.rotation.z = THREE.MathUtils.lerp(phone.rotation.z, 0.035 - pointerX * 0.035, 0.05);
      }
      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
      resizeObserver.disconnect();
      screenTexture?.dispose();
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh || object instanceof THREE.LineSegments)) return;
        object.geometry.dispose();
        const material = object.material;
        if (Array.isArray(material)) material.forEach((item) => item.dispose());
        else material.dispose();
      });
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative h-[560px] w-full touch-pan-y select-none sm:h-[620px] ${className}`}
      role="img"
      aria-label="Mockup 3D de um celular Android com o aplicativo MaisCtrl"
    >
      <canvas ref={canvasRef} className="block h-full w-full" aria-hidden="true" />
      {webglUnavailable && (
        <div className="absolute inset-0 grid place-items-center rounded-[2rem] border border-border/70 bg-card/80 p-8 text-center text-sm text-muted-foreground">
          <div>
            <p className="font-semibold text-foreground">MaisCtrl para Android</p>
            <p className="mt-2">Ative a aceleração gráfica para visualizar o mockup 3D.</p>
          </div>
        </div>
      )}
    </div>
  );
}
