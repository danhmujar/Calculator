# Technology Stack: Optimized Math Calculator

**Project:** Calculator
**Researched:** 2024-03-29

## Recommended Stack

### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vite | 5.x | Build Tool | Fast HMR and efficient tree-shaking for JS modules. |
| Vanilla JS | ES2022+ | UI Framework | Zero-overhead, maximum control over DOM updates. |

### Math Engine
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Math.js | 12.x | Calculation Engine | Precise fractions and BigNumber support (essential for accurate math). |

### UI Components
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| MathLive | 0.98+ | Formula Entry | High-quality TeX-based editing with accessibility. |

### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vite-plugin-pwa | 0.19+ | Offline Support | Enabling full calculator functionality without internet. |
| vite-plugin-compression | 3.x | Brotli Compression | Reducing the size of transmitted assets. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Engine | Math.js | Native `eval()` | Native `eval()` is insecure and has precision issues (0.1+0.2 != 0.3). |
| Editor | MathLive | Simple Input | Text inputs cannot handle complex math notations like fractions/powers correctly. |

## Installation

```bash
# Core Dependencies
npm install mathjs mathlive

# Dev Dependencies
npm install -D vite vite-plugin-pwa vite-plugin-compression
```

## Sources

- [Math.js Official Docs](https://mathjs.org/)
- [MathLive Official Docs](https://mathlive.io/)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
