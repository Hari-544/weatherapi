import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import '../styles/landing.css';

export default function LandingPage() {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const scrollProgressRef = useRef(0);
  const navigateTo = useNavigate();
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    // Initialize Three.js scene
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x0f172a, 0.1);
    container.appendChild(renderer.domElement);

    // Create animated background with weather theme
    const geometry = new THREE.BufferGeometry();
    const vertexCount = 1000;
    const positions = new Float32Array(vertexCount * 3);
    const colors = new Float32Array(vertexCount * 3);

    for (let i = 0; i < vertexCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 20;
      positions[i + 1] = (Math.random() - 0.5) * 20;
      positions[i + 2] = (Math.random() - 0.5) * 20;

      // Weather theme colors: orange, red, blue, cyan
      const colorChoice = Math.random();
      if (colorChoice < 0.3) {
        colors[i] = 0.9; // Red
        colors[i + 1] = 0.3;
        colors[i + 2] = 0.2;
      } else if (colorChoice < 0.6) {
        colors[i] = 0.3; // Blue
        colors[i + 1] = 0.6;
        colors[i + 2] = 1;
      } else {
        colors[i] = 1; // Cyan
        colors[i + 1] = 0.7;
        colors[i + 2] = 0.2;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Create India-like map shape with lines
    const mapGeometry = new THREE.BufferGeometry();
    const mapVertices = [];
    const mapColors = [];

    // Simplified India map points (normalized coordinates)
    const indiaPoints = [
      [0.2, 0.3], [0.3, 0.25], [0.4, 0.22], [0.45, 0.28],
      [0.5, 0.25], [0.55, 0.3], [0.6, 0.35], [0.58, 0.42],
      [0.52, 0.45], [0.45, 0.48], [0.4, 0.5], [0.35, 0.48],
      [0.3, 0.45], [0.25, 0.4], [0.22, 0.35], [0.2, 0.3],
    ];

    for (let i = 0; i < indiaPoints.length; i++) {
      const [x, y] = indiaPoints[i];
      mapVertices.push((x - 0.5) * 8, (y - 0.5) * 6, 0);
      mapColors.push(0.2, 0.8, 0.9); // Cyan for map
    }

    mapGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(mapVertices), 3));
    mapGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(mapColors), 3));

    const mapMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      linewidth: 2,
    });

    const mapLines = new THREE.Line(mapGeometry, mapMaterial);
    scene.add(mapLines);

    // Handle scroll
    const onScroll = () => {
      scrollProgressRef.current = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      setScrollProgress(scrollProgressRef.current);

      if (sceneRef.current) {
        sceneRef.current.rotation.x = scrollProgressRef.current * Math.PI * 0.5;
        sceneRef.current.rotation.z = scrollProgressRef.current * Math.PI * 0.2;
      }
    };

    // Handle resize
    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      particles.rotation.x += 0.0001;
      particles.rotation.y += 0.0003;

      mapLines.rotation.x += 0.0002;
      mapLines.rotation.y += 0.0001;

      renderer.render(scene, camera);
    };

    window.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onWindowResize);

    animate();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onWindowResize);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="landing-page">
      <div className="canvas-container" ref={containerRef} />

      {/* Navigation */}
      <nav className="nav-header">
        <div className="nav-content">
          <div className="logo">
            <span className="logo-icon">🌩️</span>
            <span className="logo-text">WeatherAPI</span>
          </div>
          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#analytics" className="nav-link">Analytics</a>
            <a href="#about" className="nav-link">About</a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="landing-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-container">
            <div className="hero-text">
              <h1 className="hero-title">
                National Weather
                <span className="gradient-text"> Big Data</span>
                <br />
                Analytics Platform
              </h1>
              <p className="hero-subtitle">
                Real-time weather intelligence for India. Harness the power of collective weather observations.
              </p>
              <div className="hero-buttons">
                <button 
                  className="btn btn-primary"
                  onClick={() => navigateTo('/login')}
                >
                  Enter Platform
                </button>
                <button className="btn btn-secondary">
                  Learn More
                </button>
              </div>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <div className="stat-number">250+</div>
                <div className="stat-label">Weather Events</div>
              </div>
              <div className="stat">
                <div className="stat-number">28</div>
                <div className="stat-label">Indian States</div>
              </div>
              <div className="stat">
                <div className="stat-number">Real-Time</div>
                <div className="stat-label">Data Tracking</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="features-section">
          <div className="section-header">
            <h2>Powerful Features</h2>
            <p>Everything you need to understand India's weather patterns</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📡</div>
              <h3>Multi-Source Collection</h3>
              <p>Aggregate data from Twitter/X, news sites, OpenWeather API, and citizen reports</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🗺️</div>
              <h3>Interactive Mapping</h3>
              <p>Visualize weather events across India with our advanced Leaflet-based maps</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Real-Time Analytics</h3>
              <p>Track events by type, severity, state, and source with dynamic charts</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>ML-Powered Insights</h3>
              <p>Fake detection, categorization, and deduplication with advanced algorithms</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Citizen Reports</h3>
              <p>Crowdsourced weather observations with photo and video evidence</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">✅</div>
              <h3>Verification Workflow</h3>
              <p>Admin-led verification pipeline with detailed review statistics</p>
            </div>
          </div>
        </section>

        {/* Analytics Section */}
        <section id="analytics" className="analytics-section">
          <div className="section-header">
            <h2>Advanced Analytics Dashboard</h2>
            <p>Comprehensive insights into weather patterns across India</p>
          </div>

          <div className="analytics-showcase">
            <div className="analytics-item">
              <div className="analytics-icon">📈</div>
              <h3>Event Trends</h3>
              <p>Track weather events over time with granular analytics</p>
            </div>
            <div className="analytics-item">
              <div className="analytics-icon">🔥</div>
              <h3>Severity Heatmap</h3>
              <p>Geographic distribution of high-severity weather events</p>
            </div>
            <div className="analytics-item">
              <div className="analytics-icon">📍</div>
              <h3>Top Cities</h3>
              <p>Identify hotspots with highest weather event concentration</p>
            </div>
            <div className="analytics-item">
              <div className="analytics-icon">🎯</div>
              <h3>Source Breakdown</h3>
              <p>Analyze data quality by source with verification statistics</p>
            </div>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section id="about" className="tech-section">
          <div className="section-header">
            <h2>Enterprise Tech Stack</h2>
            <p>Built with cutting-edge technologies for reliability and scalability</p>
          </div>

          <div className="tech-stack">
            <div className="tech-category">
              <h3>Backend</h3>
              <ul>
                <li>FastAPI + Python 3.11</li>
                <li>PostgreSQL 16</li>
                <li>SQLAlchemy 2.0</li>
                <li>scikit-learn ML</li>
              </ul>
            </div>
            <div className="tech-category">
              <h3>Frontend</h3>
              <ul>
                <li>React 18 + Vite</li>
                <li>Tailwind CSS</li>
                <li>Leaflet Maps</li>
                <li>Recharts Viz</li>
              </ul>
            </div>
            <div className="tech-category">
              <h3>Infrastructure</h3>
              <ul>
                <li>Docker Compose</li>
                <li>CI/CD Pipeline</li>
                <li>Async Operations</li>
                <li>JWT Auth</li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="cta-content">
            <h2>Ready to Explore India's Weather Data?</h2>
            <p>Join thousands analyzing real-time weather patterns</p>
            <button 
              className="btn btn-primary btn-large"
              onClick={() => navigateTo('/login')}
            >
              Get Started Now
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="landing-footer">
          <div className="footer-content">
            <div className="footer-section">
              <h4>WeatherAPI</h4>
              <p>National Weather Big Data Analytics Platform for India</p>
            </div>
            <div className="footer-section">
              <h4>Resources</h4>
              <ul>
                <li><a href="#docs">Documentation</a></li>
                <li><a href="#api">API Reference</a></li>
                <li><a href="#guides">Guides</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Community</h4>
              <ul>
                <li><a href="#github">GitHub</a></li>
                <li><a href="#twitter">Twitter</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 WeatherAPI. All rights reserved.</p>
          </div>
        </footer>
      </div>

      {/* Scroll Indicator */}
      <div className="scroll-indicator">
        <div className="scroll-progress" style={{ width: `${scrollProgress * 100}%` }} />
      </div>
    </div>
  );
}
