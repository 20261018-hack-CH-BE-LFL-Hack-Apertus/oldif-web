"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import s from "./SpatialGraphStyles.module.css";
export type GraphNode = { id: string; title: string };
export function SpatialGraph({
  nodes,
  onSelect,
  unavailable,
}: {
  nodes: GraphNode[];
  onSelect: (id: string) => void;
  unavailable: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const callback = useRef(onSelect);
  callback.current = onSelect;
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setError(true);
      return;
    }
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      host.clientWidth / host.clientHeight,
      0.1,
      100,
    );
    camera.position.set(0, 0, 12);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    host.appendChild(renderer.domElement);
    const group = new THREE.Group();
    scene.add(group);
    const geometry = new THREE.SphereGeometry(0.22, 20, 12);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(
        getComputedStyle(host).getPropertyValue("--accent").trim(),
      ),
    });
    const meshes = nodes.map((node, i) => {
      const mesh = new THREE.Mesh(geometry, material);
      const angle = i * Math.PI * (3 - Math.sqrt(5));
      const y = nodes.length < 2 ? 0 : 1 - (i / (nodes.length - 1)) * 2;
      const radius = Math.sqrt(1 - y * y) * 3;
      mesh.position.set(
        Math.cos(angle) * radius,
        y * 3,
        Math.sin(angle) * radius,
      );
      mesh.userData.id = node.id;
      group.add(mesh);
      return mesh;
    });
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    function click(e: MouseEvent) {
      const bounds = host!.getBoundingClientRect();
      pointer.set(
        ((e.clientX - bounds.left) / bounds.width) * 2 - 1,
        (-(e.clientY - bounds.top) / bounds.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(meshes)[0];
      if (hit) callback.current(String(hit.object.userData.id));
    }
    let dragging = false;
    let previous = 0;
    function down(e: PointerEvent) {
      dragging = true;
      previous = e.clientX;
    }
    function move(e: PointerEvent) {
      if (dragging) {
        group.rotation.y += (e.clientX - previous) * 0.008;
        previous = e.clientX;
        renderer.render(scene, camera);
      }
    }
    function up() {
      dragging = false;
    }
    function resize() {
      camera.aspect = host!.clientWidth / host!.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host!.clientWidth, host!.clientHeight);
      renderer.render(scene, camera);
    }
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    host.addEventListener("click", click);
    host.addEventListener("pointerdown", down);
    host.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    renderer.render(scene, camera);
    return () => {
      observer.disconnect();
      host.removeEventListener("click", click);
      host.removeEventListener("pointerdown", down);
      host.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [nodes]);
  return (
    <div ref={ref} className={s.viewer} role="img" aria-label={unavailable}>
      {error && <p>{unavailable}</p>}
    </div>
  );
}
