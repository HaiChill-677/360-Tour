import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { ArrowUpRight } from 'lucide-react';
import { pointOnSphere } from '../utils/sphere.js';


// Zoom bằng cách điều chỉnh FOV của camera: chỉ thay đổi góc nhìn,
// không phóng to texture và không tăng độ phân giải ảnh gốc.
function WheelZoom({ panoramaId }) {
  const { camera, gl } = useThree();
  const targetFov = useRef(75);

  useEffect(() => {
    targetFov.current = 75;
    camera.fov = 75;
    camera.updateProjectionMatrix();
  }, [camera, panoramaId]);

  useEffect(() => {
    const canvas = gl.domElement;
    const handleWheel = (event) => {
      event.preventDefault();
      // deltaY âm = cuộn lên (zoom in), deltaY dương = cuộn xuống (zoom out).
      targetFov.current = THREE.MathUtils.clamp(
        targetFov.current + event.deltaY * 0.035,
        35,
        100,
      );
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [gl]);

  useFrame((_, delta) => {
    const nextFov = THREE.MathUtils.damp(camera.fov, targetFov.current, 13, delta);
    if (Math.abs(nextFov - camera.fov) > 0.001) {
      camera.fov = nextFov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}

function PanoramaSphere({ panorama, mode, onCreateHotspot, onTextureError }) {
  const textureRef = useRef(null);
  const [status, setStatus] = useState('loading');
  const { gl } = useThree();

  const geometry = useMemo(() => {
    const sphere = new THREE.SphereGeometry(5, 64, 40);
    sphere.scale(-1, 1, 1);
    return sphere;
  }, [panorama.id]);

  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#101827', side: THREE.FrontSide, toneMapped: false }),
    [panorama.id],
  );

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    const texture = loader.load(
      panorama.src,
      (loadedTexture) => {
        if (cancelled) {
          loadedTexture.dispose();
          return;
        }
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        loadedTexture.generateMipmaps = true;
        loadedTexture.minFilter = THREE.LinearMipmapLinearFilter;
        loadedTexture.magFilter = THREE.LinearFilter;
        loadedTexture.anisotropy = Math.min(gl.capabilities.getMaxAnisotropy(), 4);
        loadedTexture.needsUpdate = true;
        material.map = loadedTexture;
        material.color.set('#ffffff');
        material.needsUpdate = true;
        setStatus('ready');
      },
      undefined,
      () => {
        if (!cancelled) {
          setStatus('error');
          onTextureError?.();
        }
      },
    );

    textureRef.current = texture;

    return () => {
      cancelled = true;
      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
      }
      material.map = null;
      geometry.dispose();
      material.dispose();
    };
  }, [panorama.src, geometry, material, gl, onTextureError]);

  const handleDoubleClick = useCallback((event) => {
    event.stopPropagation();
    if (mode !== 'edit' || status !== 'ready') return;
    onCreateHotspot(pointOnSphere(event.point));
  }, [mode, status, onCreateHotspot]);

  return (
    <mesh
      geometry={geometry}
      material={material}
      dispose={null}
      onDoubleClick={handleDoubleClick}
    />
  );
}

function HotspotMarker({ hotspot, mode, onSelect }) {
  const [hovered, setHovered] = useState(false);
  const isPreview = mode === 'preview';

  return (
    <group position={hotspot.position}>
      <mesh>
        <sphereGeometry args={[hovered ? 0.16 : 0.12, 16, 16]} />
        <meshBasicMaterial color={isPreview ? '#a7f3d0' : '#67e8f9'} />
      </mesh>
      <Html center distanceFactor={8} style={{ pointerEvents: 'auto' }}>
        <button
          type="button"
          aria-label={`${hotspot.name} — ${isPreview ? `đi đến ${hotspot.targetName ?? 'không gian đích'}` : 'chỉnh sửa checkpoint'}`}
          className={`hotspot-marker ${isPreview ? 'hotspot-marker-preview' : ''} ${hovered ? 'hotspot-marker-active' : ''}`}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(hotspot);
          }}
          onDoubleClick={(event) => event.stopPropagation()}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <span className="hotspot-marker-icon">{hotspot.icon}</span>
          <span className="hotspot-marker-label">
            <span>{hotspot.name}</span>
            {isPreview && <span className="hotspot-marker-action"><ArrowUpRight size={11} /> {hotspot.targetName ?? 'ĐI ĐẾN'}</span>}
          </span>
        </button>
      </Html>
    </group>
  );
}

function Scene({ panorama, hotspots, mode, onCreateHotspot, onSelectHotspot, onTextureError }) {
  return (
    <>
      <color attach="background" args={['#080b14']} />
      <WheelZoom panoramaId={panorama.id} />
      <PanoramaSphere
        key={panorama.id}
        panorama={panorama}
        mode={mode}
        onCreateHotspot={onCreateHotspot}
        onTextureError={onTextureError}
      />
      {hotspots.map((hotspot) => (
        <HotspotMarker
          key={hotspot.id}
          hotspot={hotspot}
          mode={mode}
          onSelect={onSelectHotspot}
        />
      ))}
      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom={false}
        minDistance={0.01}
        maxDistance={0.01}
        rotateSpeed={-0.28}
        enableDamping
        dampingFactor={0.08}
      />
    </>
  );
}

export default function TourViewer({
  panorama,
  hotspots = [],
  mode = 'edit',
  onCreateHotspot,
  onSelectHotspot,
}) {
  const [textureError, setTextureError] = useState(false);
  const handleTextureError = useCallback(() => setTextureError(true), []);

  useEffect(() => setTextureError(false), [panorama?.id]);

  if (!panorama) return null;

  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 0, 0.01], fov: 75, near: 0.01, far: 80 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, powerPreference: 'low-power', alpha: false }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.setClearColor('#080b14', 1);
        }}
      >
        <Scene
          panorama={panorama}
          hotspots={hotspots}
          mode={mode}
          onCreateHotspot={onCreateHotspot}
          onSelectHotspot={onSelectHotspot}
          onTextureError={handleTextureError}
        />
      </Canvas>

      {textureError && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="glass-panel max-w-md p-5 text-center">
            <p className="font-semibold text-white">Không tải được panorama</p>
            <p className="mt-2 text-sm text-slate-300">
              Kiểm tra tệp ảnh trong <code>public/panoramas</code> hoặc tải ảnh mới lên.
            </p>
          </div>
        </div>
      )}

      {mode === 'edit' && (
        <div className="pointer-events-none absolute left-1/2 top-24 -translate-x-1/2 rounded-full border border-white/10 bg-slate-950/45 px-4 py-2 text-center text-xs font-medium text-white/80 shadow-lg backdrop-blur-xl">
          Nhấp đúp để đặt checkpoint · Cuộn chuột để zoom · Kéo để xoay
        </div>
      )}

      {mode === 'preview' && hotspots.length > 0 && (
        <div className="pointer-events-none absolute left-1/2 top-24 -translate-x-1/2 rounded-full border border-emerald-200/20 bg-slate-950/50 px-4 py-2 text-center text-xs font-medium text-emerald-100/90 shadow-lg backdrop-blur-xl">
          Nhấp vào biểu tượng “ĐI ĐẾN” để chuyển không gian · Cuộn chuột để zoom
        </div>
      )}
    </div>
  );
}
