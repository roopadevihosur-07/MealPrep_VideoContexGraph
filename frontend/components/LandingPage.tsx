"use client";

import { Box, Button, Container, Flex, Heading, Text, VStack, HStack, Grid, Icon } from "@chakra-ui/react";
import { ChevronRight, Video, Brain, Database, Zap, Users, BarChart3, Leaf, ArrowRight, TrendingUp, Shield, Lightbulb, Code2, ChevronDown } from "lucide-react";
import { ReactNode, useState, useEffect, useRef } from "react";

interface LandingPageProps {
  onLaunch: () => void;
}

// Sweetgreen Design Tokens
const colors = {
  cream: "#f4f3e7",
  deepForest: "#00473c",
  limeGlow: "#e6ff55",
  sageMist: "#d8e5d6",
  warmSand: "#e8dcc6",
  forestShadow: "#0e150e",
};

function FeatureCard({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <Box
      p={8}
      bg={colors.sageMist}
      borderRadius="20px"
      transition="all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
      _hover={{ transform: "translateY(-6px)", boxShadow: "0 16px 40px rgba(0, 71, 60, 0.12)" }}
    >
      <Flex
        mb={6}
        w={14}
        h={14}
        bg={colors.limeGlow}
        borderRadius="16px"
        align="center"
        justify="center"
        transition="all 0.3s"
      >
        <Icon as={() => icon as any} w={7} h={7} color={colors.deepForest} />
      </Flex>
      <Heading size="md" mb={3} color={colors.forestShadow} fontFamily="system-ui" fontSize="20px">
        {title}
      </Heading>
      <Text color={colors.deepForest} fontSize="15px" lineHeight="1.6" opacity={0.8}>
        {description}
      </Text>
    </Box>
  );
}

function SponsorLogo({ name }: { name: string }) {
  return (
    <Flex
      px={6}
      py={4}
      bg={colors.sageMist}
      borderRadius="20px"
      align="center"
      justify="center"
      color={colors.deepForest}
      fontWeight="700"
      fontSize="sm"
      textAlign="center"
      transition="all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
      _hover={{
        transform: "translateY(-4px)",
        boxShadow: "0 12px 24px rgba(0, 71, 60, 0.15)"
      }}
    >
      {name}
    </Flex>
  );
}

// Animated Counter Component
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const countRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted.current) {
          hasStarted.current = true;
          const increment = target / 50;
          const interval = setInterval(() => {
            setCount((prev) => {
              const next = prev + increment;
              if (next >= target) {
                clearInterval(interval);
                return target;
              }
              return next;
            });
          }, 30);
        }
      },
      { threshold: 0.5 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => observer.disconnect();
  }, [target]);

  return (
    <Box ref={countRef}>
      <Box
        display="inline-block"
        px={4}
        py={2}
        bg={colors.limeGlow}
        borderRadius="12px"
      >
        <Text
          fontSize="48px"
          fontWeight="700"
          color={colors.deepForest}
        >
          {Math.floor(count)}{suffix}
        </Text>
      </Box>
    </Box>
  );
}

// Scroll-triggered Animation
function ScrollRevealBox({ children, ...props }: { children: ReactNode; [key: string]: any }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <Box
      ref={ref}
      opacity={isVisible ? 1 : 0}
      transform={isVisible ? "translateY(0)" : "translateY(20px)"}
      transition="all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)"
      {...props}
    >
      {children}
    </Box>
  );
}

// Interactive FAQ Item
function FAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ScrollRevealBox w="100%" style={{ transitionDelay: `${index * 50}ms` }}>
      <Box
        p={6}
        bg={isOpen ? `rgba(230, 255, 85, 0.15)` : colors.sageMist}
        borderRadius="16px"
        w="100%"
        transition="all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
        cursor="pointer"
        borderLeft={isOpen ? `4px solid ${colors.limeGlow}` : "4px solid transparent"}
        _hover={{
          bg: isOpen ? `rgba(230, 255, 85, 0.15)` : `rgba(230, 255, 85, 0.08)`,
          boxShadow: "0 8px 24px rgba(0, 71, 60, 0.1)"
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Flex justify="space-between" align="center">
          <Heading size="sm" color={colors.forestShadow} fontSize="16px">
            ❓ {question}
          </Heading>
          <Box
            transition="transform 0.3s"
            transform={isOpen ? "rotate(180deg)" : "rotate(0deg)"}
          >
            <ChevronDown size={20} color={colors.deepForest} />
          </Box>
        </Flex>
        {isOpen && (
          <Text
            fontSize="14px"
            color={colors.deepForest}
            opacity={0.85}
            lineHeight="1.6"
            mt={4}
            style={{
              animation: `fadeIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)`
            }}
          >
            {answer}
          </Text>
        )}
      </Box>
    </ScrollRevealBox>
  );
}

// Interactive Background Component
function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState(false);
  const particlesRef = useRef<Array<{x: number, y: number, vx: number, vy: number, size: number, opacity: number}>>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Initialize particles
    const particleCount = 30;
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 1,
      vy: (Math.random() - 0.5) * 1,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.3 + 0.1
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle, i) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off walls
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Wrap around
        particle.x = (particle.x + canvas.width) % canvas.width;
        particle.y = (particle.y + canvas.height) % canvas.height;

        // Draw particle
        ctx.fillStyle = `rgba(230, 255, 85, ${particle.opacity * 0.6})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        // Draw connection lines to nearby particles and mouse
        particlesRef.current.forEach((other, j) => {
          if (i >= j) return;

          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.strokeStyle = `rgba(230, 255, 85, ${(1 - dist / 150) * 0.2})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        });

        // Draw connections to mouse
        const mdx = particle.x - mousePos.x;
        const mdy = particle.y - mousePos.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);

        if (mdist < 200) {
          ctx.strokeStyle = `rgba(230, 255, 85, ${(1 - mdist / 200) * 0.4})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(mousePos.x, mousePos.y);
          ctx.stroke();
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [mousePos]);

  if (!isClient) {
    return null;
  }

  return (
    <Box
      as="canvas"
      ref={canvasRef}
      position="fixed"
      top={0}
      left={0}
      w="100%"
      h="100%"
      pointerEvents="none"
      zIndex={0}
      style={{ opacity: 0.6 }}
    />
  );
}

// Interactive Tab Component for Features
function InteractiveTabs() {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = [
    {
      label: "🎬 Input",
      content: "Upload meal prep videos from YouTube, Vimeo, or your local storage. Supports MP4, MOV, WebM, and more."
    },
    {
      label: "⚡ Processing",
      content: "Our AI pipeline analyzes videos in parallel, extracting visual content, speech, and text in seconds."
    },
    {
      label: "📊 Storage",
      content: "Data is stored in Neo4j with automatic deduplication across videos for a unified knowledge graph."
    },
    {
      label: "🔍 Query",
      content: "Ask natural language questions and get instant answers powered by semantic search on the knowledge graph."
    }
  ];

  return (
    <VStack spacing={6} w="100%">
      <Flex wrap="wrap" justify="center" gap={2}>
        {tabs.map((tab, i) => (
          <Button
            key={i}
            onClick={() => setActiveTab(i)}
            bg={activeTab === i ? colors.limeGlow : colors.sageMist}
            color={activeTab === i ? colors.deepForest : colors.deepForest}
            borderRadius="9999px"
            px={6}
            py={3}
            transition="all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
            _hover={{
              transform: "translateY(-2px)",
              boxShadow: activeTab === i ? "0 8px 24px rgba(230, 255, 85, 0.3)" : "0 4px 12px rgba(0, 71, 60, 0.1)"
            }}
            fontWeight={activeTab === i ? "700" : "600"}
          >
            {tab.label}
          </Button>
        ))}
      </Flex>
      <Box
        p={8}
        bg={colors.sageMist}
        borderRadius="20px"
        w="100%"
        minH="120px"
        borderLeft={`6px solid ${colors.limeGlow}`}
        transition="all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
      >
        <Text
          fontSize="16px"
          color={colors.deepForest}
          lineHeight="1.8"
          style={{
            animation: `fadeIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)`
          }}
        >
          {tabs[activeTab].content}
        </Text>
      </Box>
    </VStack>
  );
}

// Image carousel component
function ImageCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const images = [
    { name: "mealprep-1.png", alt: "Meal prep 1" },
    { name: "mealprep-2.png", alt: "Meal prep 2" },
    { name: "mealprep-3.png", alt: "Meal prep 3" },
    { name: "mealprep-4.png", alt: "Meal prep 4" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <Box position="relative" w="100%" h="400px" overflow="hidden" borderRadius="20px" boxShadow="0 12px 32px rgba(0, 71, 60, 0.15)">
      {images.map((image, index) => (
        <Box
          key={index}
          position="absolute"
          inset={0}
          as="img"
          src={`/images/${image.name}`}
          alt={image.alt}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
          }}
          opacity={index === currentIndex ? 1 : 0}
          transition="opacity 0.8s ease-in-out"
        />
      ))}
      {/* Overlay gradient */}
      <Box
        position="absolute"
        inset={0}
        bg={`linear-gradient(135deg, rgba(0, 71, 60, 0.15) 0%, rgba(230, 255, 85, 0.08) 100%)`}
        pointerEvents="none"
      />
      {/* Dots indicator */}
      <HStack position="absolute" bottom={4} left="50%" transform="translateX(-50%)" gap={2} zIndex={2}>
        {images.map((_, index) => (
          <Box
            key={index}
            w={index === currentIndex ? "24px" : "8px"}
            h="8px"
            borderRadius="9999px"
            bg={index === currentIndex ? colors.limeGlow : "rgba(255, 255, 255, 0.5)"}
            transition="all 0.3s"
            cursor="pointer"
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </HStack>
    </Box>
  );
}

// Animated meal prep background
const MealPrepBackground = () => {
  const keyframes = `
    @keyframes float1 {
      0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.12; }
      50% { transform: translateY(-20px) rotate(5deg); opacity: 0.15; }
    }
    @keyframes float2 {
      0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.12; }
      50% { transform: translateY(-25px) rotate(-8deg); opacity: 0.14; }
    }
    @keyframes float3 {
      0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.11; }
      50% { transform: translateY(-15px) rotate(3deg); opacity: 0.13; }
    }
    @keyframes pulse1 {
      0%, 100% { r: 30; opacity: 0.12; }
      50% { r: 32; opacity: 0.16; }
    }
    @keyframes pulse2 {
      0%, 100% { r: 28; opacity: 0.11; }
      50% { r: 30; opacity: 0.15; }
    }
    @keyframes sway {
      0%, 100% { transform: rotateZ(-2deg); }
      50% { transform: rotateZ(2deg); }
    }
  `;

  return (
    <>
      <style>{keyframes}</style>
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Animated vegetables and ingredients */}
        <g fill={colors.deepForest} opacity="0.12">
          {/* Floating Tomatoes */}
          <circle cx="150" cy="100" r="30" style={{ animation: "pulse1 4s ease-in-out infinite, float1 6s ease-in-out infinite" }} />
          <circle cx="1050" cy="150" r="28" style={{ animation: "pulse2 5s ease-in-out infinite, float2 7s ease-in-out infinite" }} />
          <circle cx="200" cy="700" r="32" style={{ animation: "pulse1 4.5s ease-in-out infinite 0.5s, float3 6.5s ease-in-out infinite" }} />

          {/* Animated Bell peppers */}
          <g style={{ animation: "float2 5s ease-in-out infinite", transformOrigin: "970px 310px" }}>
            <path d="M 950 300 Q 980 280 990 310 Q 980 340 950 330 Q 940 320 950 300" />
          </g>
          <g style={{ animation: "float1 6s ease-in-out infinite 0.3s", transformOrigin: "120px 510px" }}>
            <path d="M 100 500 Q 130 480 140 510 Q 130 540 100 530 Q 90 520 100 500" />
          </g>

          {/* Swaying Carrots/utensils */}
          <g style={{ animation: "sway 3s ease-in-out infinite", transformOrigin: "854px 120px" }}>
            <rect x="850" y="80" width="8" height="80" rx="4" transform="rotate(-25 854 120)" />
          </g>
          <g style={{ animation: "sway 3.5s ease-in-out infinite 0.2s", transformOrigin: "254px 637px" }}>
            <rect x="250" y="600" width="8" height="75" rx="4" transform="rotate(20 254 637)" />
          </g>

          {/* Animated Cutting boards */}
          <g style={{ animation: "float3 7s ease-in-out infinite 0.4s", transformOrigin: "110px 340px" }}>
            <rect x="50" y="300" width="120" height="80" rx="8" fill="none" stroke={colors.deepForest} strokeWidth="2" opacity="0.1" />
          </g>
          <g style={{ animation: "float2 6s ease-in-out infinite 0.6s", transformOrigin: "1090px 540px" }}>
            <rect x="1030" y="500" width="120" height="80" rx="8" fill="none" stroke={colors.deepForest} strokeWidth="2" opacity="0.1" />
          </g>

          {/* Animated Bowls */}
          <g style={{ animation: "pulse1 5.5s ease-in-out infinite 0.5s", transformOrigin: "500px 150px" }}>
            <circle cx="500" cy="150" r="35" fill="none" stroke={colors.deepForest} strokeWidth="2" opacity="0.1" />
          </g>
          <g style={{ animation: "pulse2 5s ease-in-out infinite 0.3s", transformOrigin: "700px 650px" }}>
            <circle cx="700" cy="650" r="38" fill="none" stroke={colors.deepForest} strokeWidth="2" opacity="0.1" />
          </g>

          {/* Floating Leaves/garnish */}
          <g style={{ animation: "float1 7.5s ease-in-out infinite", transformOrigin: "300px 80px" }}>
            <ellipse cx="300" cy="80" rx="15" ry="25" transform="rotate(-30 300 80)" opacity="0.15" />
          </g>
          <g style={{ animation: "float3 8s ease-in-out infinite 0.2s", transformOrigin: "900px 700px" }}>
            <ellipse cx="900" cy="700" rx="18" ry="28" transform="rotate(45 900 700)" opacity="0.15" />
          </g>
        </g>

        {/* Additional animated elements for richness */}
        <g fill={colors.limeGlow} opacity="0.05">
          {/* Accent circles */}
          <circle cx="600" cy="200" r="20" style={{ animation: "float2 8s ease-in-out infinite 0.5s" }} />
          <circle cx="400" cy="500" r="15" style={{ animation: "float1 7s ease-in-out infinite 0.3s" }} />
          <circle cx="800" cy="400" r="18" style={{ animation: "float3 9s ease-in-out infinite 0.7s" }} />
        </g>
      </svg>
    </>
  );
};

export function LandingPage({ onLaunch }: LandingPageProps) {
  return (
    <Box bg={colors.cream} minH="100vh" color={colors.forestShadow} overflowX="hidden" position="relative">
      <InteractiveBackground />
      {/* Hero + What It Does Section */}
      <Box bg={colors.cream} pt={{ base: 16, md: 32 }} pb={{ base: 20, md: 32 }} position="relative" overflow="hidden" w="100%">
        <MealPrepBackground />
        <Box position="absolute" top={0} right={0} w="40%" h="100%" bg={`linear-gradient(135deg, ${colors.limeGlow}15 0%, ${colors.sageMist}15 100%)`} />
        <Flex justify="center" position="relative" zIndex={2} w="100%">
          <Box w="100%" px={{ base: 4, md: 8, lg: 12 }}>
            <VStack spacing={12}>
              {/* Hero Content */}
              <VStack spacing={10} textAlign="center" w="100%">
                <Box
                  px={4}
                  py={2}
                  bg={colors.sageMist}
                  borderRadius="9999px"
                  display="inline-block"
                  mb={4}
                >
                  <Text fontSize="13px" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" color={colors.deepForest}>
                    ✨ AI-Powered Video Intelligence
                  </Text>
                </Box>

                <Heading
                  as="h1"
                  fontSize={{ base: "48px", md: "72px" }}
                  fontWeight="300"
                  lineHeight="1.1"
                  color={colors.forestShadow}
                  fontFamily="system-ui"
                  letterSpacing="-0.02em"
                  mb={6}
                >
                  Meal Prep
                  <Box as="span" display="block" color={colors.deepForest}>
                    Video Context Graph
                  </Box>
                </Heading>

                <Text fontSize={{ base: "17px", md: "20px" }} maxW="700px" color={colors.deepForest} opacity={0.85} lineHeight="1.6" fontWeight="300">
                  Transform cooking videos into interactive knowledge graphs. Understand recipes, nutritional claims, and meal prep strategies through AI-powered video analysis.
                </Text>
              </VStack>

              {/* What It Does Content */}
              <VStack spacing={12} w="100%">
                <VStack spacing={4} textAlign="center" w="100%">
                  <Box
                    px={4}
                    py={2}
                    bg={colors.sageMist}
                    borderRadius="9999px"
                    display="inline-block"
                  >
                    <Text fontSize="13px" fontWeight="700" textTransform="uppercase" color={colors.deepForest} letterSpacing="0.08em">
                      What It Does
                    </Text>
                  </Box>
                  <Heading
                    fontSize={{ base: "36px", md: "48px" }}
                    fontWeight="400"
                    color={colors.forestShadow}
                    fontFamily="system-ui"
                    lineHeight="1.2"
                    px={{ base: 2, md: 0 }}
                  >
                    Powerful Capabilities in Action
                  </Heading>
                </VStack>

              {/* Animated Functionality Cards */}
              <Grid
                templateColumns={{ base: "1fr", md: "1fr 1fr", lg: "1fr 1fr 1fr 1fr" }}
                gap={6}
                w="100%"
              >
                {[
                  {
                    icon: <Video size={24} />,
                    title: "Video Analysis",
                    description: "Instantly understand cooking videos with frame-by-frame visual analysis",
                    delay: "0s"
                  },
                  {
                    icon: <Brain size={24} />,
                    title: "AI Extraction",
                    description: "Automatically extract recipes, claims, and techniques from unstructured video",
                    delay: "0.1s"
                  },
                  {
                    icon: <Database size={24} />,
                    title: "Knowledge Graph",
                    description: "Build connected relationships between ingredients, nutrients, and techniques",
                    delay: "0.2s"
                  },
                  {
                    icon: <Zap size={24} />,
                    title: "Intelligent Search",
                    description: "Ask natural language questions and get semantic answers across all videos",
                    delay: "0.3s"
                  }
                ].map((feature, i) => (
                  <Box
                    key={i}
                    p={8}
                    bg={colors.sageMist}
                    borderRadius="20px"
                    borderLeft={`4px solid ${colors.limeGlow}`}
                    position="relative"
                    overflow="visible"
                    transition="all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
                    _hover={{
                      transform: "translateY(-8px)",
                      boxShadow: "0 20px 50px rgba(0, 71, 60, 0.15)"
                    }}
                    style={{
                      animation: `slideInUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${feature.delay} both`
                    }}
                  >
                    <Flex align="flex-start" gap={4}>
                      <Flex
                        w={12}
                        h={12}
                        bg={colors.limeGlow}
                        borderRadius="12px"
                        align="center"
                        justify="center"
                        flexShrink={0}
                        transition="all 0.3s"
                        color={colors.deepForest}
                      >
                        {feature.icon}
                      </Flex>
                      <VStack align="start" spacing={3} flex={1}>
                        <Heading size="md" color={colors.forestShadow} fontFamily="system-ui" fontSize="18px">
                          {feature.title}
                        </Heading>
                        <Text color={colors.deepForest} fontSize="14px" lineHeight="1.6" opacity={0.8}>
                          {feature.description}
                        </Text>
                      </VStack>
                    </Flex>
                  </Box>
                ))}
              </Grid>

              {/* Animated flow indicators */}
              <Box w="100%" mt={8}>
                <Flex
                  justify="center"
                  gap={2}
                  align="center"
                  display={{ base: "none", md: "flex" }}
                >
                  {[0, 1, 2].map((i) => (
                    <Box key={i}>
                      <Box
                        w={3}
                        h={3}
                        borderRadius="full"
                        bg={colors.limeGlow}
                        style={{
                          animation: `pulse 2s cubic-bezier(0.4, 0, 0.6, 1) ${i * 0.2}s infinite`
                        }}
                      />
                      {i < 2 && (
                        <Box
                          w={8}
                          h="2px"
                          bg={`linear-gradient(90deg, ${colors.limeGlow} 0%, transparent 100%)`}
                          display="inline-block"
                          ml={2}
                          style={{
                            animation: `flowRight 2s cubic-bezier(0.4, 0, 0.6, 1) ${i * 0.2}s infinite`
                          }}
                        />
                      )}
                    </Box>
                  ))}
                </Flex>
              </Box>

              {/* Launch Button */}
              <Button
                size="lg"
                bg={colors.limeGlow}
                color={colors.forestShadow}
                borderRadius="9999px"
                px={8}
                py={4}
                h="auto"
                fontWeight="700"
                fontSize="17px"
                rightIcon={<ChevronRight size={22} />}
                onClick={onLaunch}
                _hover={{ transform: "translateY(-3px)", boxShadow: "0 12px 36px rgba(230, 255, 85, 0.35)" }}
                _active={{ transform: "translateY(-1px)" }}
                transition="all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
              >
                Launch Application
              </Button>
            </VStack>

            </VStack>
          </Box>
        </Flex>

        {/* Add keyframe animations */}
        <style>{`
          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.4;
            }
          }

          @keyframes flowRight {
            0% {
              opacity: 0;
              transform: scaleX(0);
            }
            50% {
              opacity: 1;
            }
            100% {
              opacity: 0;
              transform: scaleX(1);
            }
          }

          @keyframes fadeCarousel {
            0% {
              opacity: 0;
            }
            25% {
              opacity: 1;
            }
            75% {
              opacity: 1;
            }
            100% {
              opacity: 0;
            }
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes slideInFromLeft {
            from {
              opacity: 0;
              transform: translateX(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes slideInFromRight {
            from {
              opacity: 0;
              transform: translateX(20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes glow {
            0%, 100% {
              box-shadow: 0 0 20px rgba(230, 255, 85, 0.3);
            }
            50% {
              box-shadow: 0 0 40px rgba(230, 255, 85, 0.5);
            }
          }

          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-8px);
            }
          }

          @keyframes slideRight {
            0% {
              transform: translateX(-100%);
            }
            50% {
              transform: translateX(100%);
            }
            100% {
              transform: translateX(-100%);
            }
          }
        `}</style>
      </Box>

      {/* Problem Section */}
      <Box bg={colors.sageMist} py={{ base: 20, md: 32 }}>
        <Flex justify="center">
          <Box w="100%" px={{ base: 4, md: 8, lg: 12 }}>
            <VStack spacing={16} align="stretch">
            <VStack spacing={6} textAlign="center">
              <Box
                px={4}
                py={2}
                bg={`rgba(0, 71, 60, 0.08)`}
                borderRadius="9999px"
                display="inline-block"
              >
                <Text fontSize="13px" fontWeight="700" textTransform="uppercase" color={colors.deepForest} letterSpacing="0.08em">
                  The Problem
                </Text>
              </Box>
              <Heading fontSize={{ base: "42px", md: "56px" }} fontWeight="400" color={colors.forestShadow} fontFamily="system-ui" lineHeight="1.1">
                Cooking Videos Are Unstructured
              </Heading>
              <Text fontSize={{ base: "17px", md: "19px" }} color={colors.deepForest} maxW="680px" mx="auto" opacity={0.85} lineHeight="1.6">
                Hours of valuable meal prep content exist in videos, but there's no way to extract, organize, and query nutritional information, cooking techniques, and ingredient relationships across multiple videos.
              </Text>
            </VStack>

            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr", lg: "repeat(auto-fit, minmax(300px, 1fr))" }} gap={6}>
              <Box p={8} bg="rgba(0, 71, 60, 0.04)" borderRadius="20px" border={`2px solid ${colors.deepForest}`}>
                <Heading size="sm" mb={6} color={colors.deepForest} fontSize="20px">❌ Before</Heading>
                <VStack spacing={3} align="start" fontSize="16px" color={colors.deepForest}>
                  <Text>• Manual note-taking from videos</Text>
                  <Text>• No way to search across videos</Text>
                  <Text>• Conflicting nutritional claims hidden</Text>
                  <Text>• Ingredient relationships unknown</Text>
                  <Text>• Time-consuming meal planning</Text>
                </VStack>
              </Box>

              <Box p={8} bg="rgba(230, 255, 85, 0.12)" borderRadius="20px" border={`2px solid ${colors.limeGlow}`}>
                <Heading size="sm" mb={6} color={colors.deepForest} fontSize="20px">✅ After</Heading>
                <VStack spacing={3} align="start" fontSize="16px" color={colors.deepForest}>
                  <Text>• Automatic video understanding</Text>
                  <Text>• Semantic search across all content</Text>
                  <Text>• Contradiction detection</Text>
                  <Text>• Cross-video ingredient analysis</Text>
                  <Text>• Intelligent meal prep suggestions</Text>
                </VStack>
              </Box>
            </Grid>
          </VStack>
          </Box>
        </Flex>
      </Box>

      {/* Image Carousel Section */}
      <Box bg={colors.cream} py={{ base: 12, md: 20 }}>
        <Flex justify="center">
          <Box w="100%" px={{ base: 4, md: 8, lg: 12 }}>
            <VStack spacing={8}>
              <VStack spacing={4} textAlign="center" w="100%">
                <Box
                  px={4}
                  py={2}
                  bg={`rgba(0, 71, 60, 0.08)`}
                  borderRadius="9999px"
                  display="inline-block"
                >
                  <Text fontSize="13px" fontWeight="700" textTransform="uppercase" color={colors.deepForest} letterSpacing="0.08em">
                    See It In Action
                  </Text>
                </Box>
                <Heading fontSize={{ base: "36px", md: "48px" }} fontWeight="400" color={colors.forestShadow} fontFamily="system-ui">
                  Real Meal Prep Videos
                </Heading>
              </VStack>
              <ImageCarousel />
            </VStack>
          </Box>
        </Flex>
      </Box>

      {/* System Architecture */}
      <Box py={{ base: 20, md: 32 }} bg={colors.cream}>
        <Flex justify="center">
          <Box w="100%" px={{ base: 4, md: 8, lg: 12 }}>
            <VStack spacing={16} align="stretch">
            <VStack spacing={6} textAlign="center">
              <Box
                px={4}
                py={2}
                bg={colors.sageMist}
                borderRadius="9999px"
                display="inline-block"
              >
                <Text fontSize="13px" fontWeight="700" textTransform="uppercase" color={colors.deepForest} letterSpacing="0.08em">
                  Technology Stack
                </Text>
              </Box>
              <Heading fontSize={{ base: "42px", md: "56px" }} fontWeight="400" color={colors.forestShadow} fontFamily="system-ui" lineHeight="1.1">
                System Architecture
              </Heading>
            </VStack>

            <Grid templateColumns={{ base: "1fr", md: "repeat(auto-fit, minmax(280px, 1fr))" }} gap={6}>
              <FeatureCard
                icon={<Video size={28} />}
                title="Video Ingestion"
                description="TwelveLabs Marengo + Pegasus analyze videos into rich, time-coded segments"
              />
              <FeatureCard
                icon={<Brain size={28} />}
                title="AI Extraction"
                description="OpenAI Structured Outputs extract claims, entities, and dependencies"
              />
              <FeatureCard
                icon={<Database size={28} />}
                title="Knowledge Graph"
                description="Neo4j stores & merges entities across videos for deduplication"
              />
            </Grid>

            <VStack spacing={8} mt={6}>
              <Heading fontSize={{ base: "24px", md: "32px" }} fontWeight="400" color={colors.forestShadow}>
                Powered By
              </Heading>
              <HStack spacing={4} justify="center" flexWrap="wrap">
                <SponsorLogo name="🎬 TwelveLabs" />
                <SponsorLogo name="🧠 OpenAI" />
                <SponsorLogo name="📊 Neo4j" />
                <SponsorLogo name="⚡ FastAPI" />
              </HStack>
            </VStack>
          </VStack>
          </Box>
        </Flex>
      </Box>

      {/* Workflow Section */}
      <Box bg={colors.warmSand} py={{ base: 20, md: 32 }}>
        <Flex justify="center">
          <Box w="100%" px={{ base: 4, md: 8, lg: 12 }}>
            <VStack spacing={16}>
            <VStack spacing={6} textAlign="center">
              <Box
                px={4}
                py={2}
                bg={`rgba(232, 220, 198, 0.6)`}
                borderRadius="9999px"
                display="inline-block"
              >
                <Text fontSize="13px" fontWeight="700" textTransform="uppercase" color={colors.deepForest} letterSpacing="0.08em">
                  How It Works
                </Text>
              </Box>
              <Heading fontSize={{ base: "42px", md: "56px" }} fontWeight="400" color={colors.forestShadow} fontFamily="system-ui" lineHeight="1.1">
                The Analysis Pipeline
              </Heading>
            </VStack>

            <Flex
              direction={{ base: "column", md: "row" }}
              align={{ base: "stretch", md: "center" }}
              justify="space-between"
              w="100%"
              gap={4}
              position="relative"
            >
              {/* Horizontal connecting line for desktop */}
              <Box
                display={{ base: "none", md: "block" }}
                position="absolute"
                top="60px"
                left="0"
                right="0"
                h="2px"
                bg={`linear-gradient(90deg, ${colors.limeGlow} 0%, ${colors.limeGlow} 100%)`}
                zIndex={0}
              />

              {[
                { num: "1", title: "Upload", desc: "Add meal prep video from YouTube or local file" },
                { num: "2", title: "Analyze", desc: "TwelveLabs extracts segments & visual content" },
                { num: "3", title: "Structure", desc: "OpenAI identifies claims, entities & dependencies" },
                { num: "4", title: "Query", desc: "Ask questions about nutrition, ingredients & techniques" }
              ].map((step, i) => (
                <Flex
                  key={i}
                  direction="column"
                  align="center"
                  flex={1}
                  position="relative"
                  zIndex={1}
                >
                  {/* Arrow between steps */}
                  {i < 3 && (
                    <Box
                      display={{ base: "block", md: "none" }}
                      w="100%"
                      textAlign="center"
                      color={colors.limeGlow}
                      fontSize="24px"
                      my={2}
                    >
                      ↓
                    </Box>
                  )}

                  <Box
                    w="100%"
                    p={7}
                    bg={colors.sageMist}
                    borderRadius="20px"
                    textAlign="center"
                    transition="all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
                    _hover={{ transform: "translateY(-4px)", boxShadow: "0 12px 32px rgba(0, 71, 60, 0.1)" }}
                  >
                    <Box
                      w={14}
                      h={14}
                      bg={colors.limeGlow}
                      borderRadius="full"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      color={colors.deepForest}
                      fontWeight="700"
                      fontSize="18px"
                      mx="auto"
                      mb={5}
                      position="relative"
                    >
                      {step.num}
                    </Box>
                    <Heading size="sm" mb={3} color={colors.forestShadow} fontSize="20px">
                      {step.title}
                    </Heading>
                    <Text fontSize="15px" color={colors.deepForest} opacity={0.85} lineHeight="1.5">
                      {step.desc}
                    </Text>
                  </Box>
                </Flex>
              ))}
            </Flex>
          </VStack>
          </Box>
        </Flex>
      </Box>

      {/* Use Cases */}
      <Box py={{ base: 20, md: 32 }} bg={colors.sageMist}>
        <Flex justify="center">
          <Box w="100%" px={{ base: 4, md: 8, lg: 12 }}>
            <VStack spacing={16}>
            <VStack spacing={6} textAlign="center">
              <Box
                px={4}
                py={2}
                bg={`rgba(216, 229, 214, 0.6)`}
                borderRadius="9999px"
                display="inline-block"
              >
                <Text fontSize="13px" fontWeight="700" textTransform="uppercase" color={colors.deepForest} letterSpacing="0.08em">
                  Real-World Applications
                </Text>
              </Box>
              <Heading fontSize={{ base: "42px", md: "56px" }} fontWeight="400" color={colors.forestShadow} fontFamily="system-ui" lineHeight="1.1">
                Use Cases
              </Heading>
            </VStack>

            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr", lg: "repeat(auto-fit, minmax(300px, 1fr))" }} gap={6}>
              {[
                {
                  icon: Leaf,
                  title: "Health-Conscious Meal Planning",
                  description: "Automatically identify high-protein, low-carb recipes and cross-reference nutritional claims across multiple creators"
                },
                {
                  icon: BarChart3,
                  title: "Nutritional Analysis",
                  description: "Detect contradicting health claims about the same ingredient and make data-driven food choices"
                },
                {
                  icon: Zap,
                  title: "Batch Cooking Optimization",
                  description: "Find ingredients used across multiple recipes to identify batch-cooking bases for efficient weekly meal prep"
                },
                {
                  icon: Users,
                  title: "Creator Content Management",
                  description: "Organize your meal prep channel's content and make it searchable for viewers"
                }
              ].map((useCase, i) => (
                <FeatureCard
                  key={i}
                  icon={<useCase.icon size={28} />}
                  title={useCase.title}
                  description={useCase.description}
                />
              ))}
            </Grid>
            </VStack>
            </Box>
        </Flex>
      </Box>

      {/* Key Benefits Section */}
      <Box py={{ base: 20, md: 32 }} bg={colors.cream}>
        <Flex justify="center">
          <Box w="100%" px={{ base: 4, md: 8, lg: 12 }}>
            <VStack spacing={16}>
              <ScrollRevealBox w="100%">
                <VStack spacing={6} textAlign="center">
                <Box
                  px={4}
                  py={2}
                  bg={colors.sageMist}
                  borderRadius="9999px"
                  display="inline-block"
                >
                  <Text fontSize="13px" fontWeight="700" textTransform="uppercase" color={colors.deepForest} letterSpacing="0.08em">
                    Why It Matters
                  </Text>
                </Box>
                <Heading fontSize={{ base: "42px", md: "56px" }} fontWeight="400" color={colors.forestShadow} fontFamily="system-ui" lineHeight="1.1">
                  Key Benefits & Advantages
                </Heading>
                <Text fontSize={{ base: "17px", md: "19px" }} color={colors.deepForest} maxW="680px" mx="auto" opacity={0.85} lineHeight="1.6">
                  Experience the power of AI-driven video analysis with intuitive semantic search
                </Text>
              </VStack>
              </ScrollRevealBox>

              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr", lg: "repeat(auto-fit, minmax(300px, 1fr))" }} gap={6} w="100%">
                {[
                  {
                    icon: TrendingUp,
                    title: "Speed & Efficiency",
                    description: "Analyze hours of video content in minutes instead of manual transcription taking days"
                  },
                  {
                    icon: Shield,
                    title: "Accuracy & Consistency",
                    description: "AI-powered extraction ensures consistent entity identification across all videos"
                  },
                  {
                    icon: Lightbulb,
                    title: "Actionable Insights",
                    description: "Discover patterns and relationships hidden in unstructured video content"
                  },
                  {
                    icon: Code2,
                    title: "Developer Friendly",
                    description: "RESTful API access to all extracted data for custom integrations and workflows"
                  }
                ].map((benefit, i) => (
                  <ScrollRevealBox key={i} style={{ transitionDelay: `${i * 100}ms` }}>
                  <Box
                    p={8}
                    bg={colors.sageMist}
                    borderRadius="20px"
                    transition="all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
                    _hover={{
                      transform: "translateY(-8px)",
                      boxShadow: "0 20px 50px rgba(0, 71, 60, 0.15)"
                    }}
                  >
                    <Flex
                      mb={6}
                      w={14}
                      h={14}
                      bg={colors.limeGlow}
                      borderRadius="16px"
                      align="center"
                      justify="center"
                    >
                      <Icon as={benefit.icon as any} w={7} h={7} color={colors.deepForest} />
                    </Flex>
                    <Heading size="md" mb={3} color={colors.forestShadow} fontFamily="system-ui" fontSize="20px">
                      {benefit.title}
                    </Heading>
                    <Text color={colors.deepForest} fontSize="15px" lineHeight="1.6" opacity={0.8}>
                      {benefit.description}
                    </Text>
                  </Box>
                  </ScrollRevealBox>
                ))}
              </Grid>
            </VStack>
          </Box>
        </Flex>
      </Box>

      {/* Technical Deep Dive Section */}
      <Box py={{ base: 20, md: 32 }} bg={colors.warmSand}>
        <Flex justify="center">
          <Box w="100%" px={{ base: 4, md: 8, lg: 12 }}>
            <VStack spacing={16}>
              <VStack spacing={6} textAlign="center">
                <Box
                  px={4}
                  py={2}
                  bg={`rgba(232, 220, 198, 0.6)`}
                  borderRadius="9999px"
                  display="inline-block"
                >
                  <Text fontSize="13px" fontWeight="700" textTransform="uppercase" color={colors.deepForest} letterSpacing="0.08em">
                    Technical Details
                  </Text>
                </Box>
                <Heading fontSize={{ base: "42px", md: "56px" }} fontWeight="400" color={colors.forestShadow} fontFamily="system-ui" lineHeight="1.1">
                  How the Intelligence Works
                </Heading>
              </VStack>

              <VStack spacing={12} w="100%">
                {/* Phase 1: Video Analysis */}
                <Box
                  p={8}
                  bg={colors.cream}
                  borderRadius="20px"
                  borderLeft={`6px solid ${colors.limeGlow}`}
                  w="100%"
                >
                  <Heading size="md" mb={4} color={colors.forestShadow} fontSize="22px">
                    🎬 Phase 1: Video Analysis & Segmentation
                  </Heading>
                  <Text color={colors.deepForest} fontSize="15px" lineHeight="1.8" mb={4}>
                    TwelveLabs API performs deep visual understanding of cooking videos, extracting meaningful segments based on:
                  </Text>
                  <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                    <VStack align="start" spacing={2}>
                      <Text fontWeight="600" color={colors.deepForest}>• Scene Detection</Text>
                      <Text fontWeight="600" color={colors.deepForest}>• Object Recognition</Text>
                      <Text fontWeight="600" color={colors.deepForest}>• Action Identification</Text>
                    </VStack>
                    <VStack align="start" spacing={2}>
                      <Text fontWeight="600" color={colors.deepForest}>• Speech Recognition</Text>
                      <Text fontWeight="600" color={colors.deepForest}>• Logo Detection</Text>
                      <Text fontWeight="600" color={colors.deepForest}>• Text Extraction</Text>
                    </VStack>
                  </Grid>
                </Box>

                {/* Phase 2: LLM Extraction */}
                <Box
                  p={8}
                  bg={colors.cream}
                  borderRadius="20px"
                  borderLeft={`6px solid ${colors.limeGlow}`}
                  w="100%"
                >
                  <Heading size="md" mb={4} color={colors.forestShadow} fontSize="22px">
                    🧠 Phase 2: LLM-Powered Entity Extraction
                  </Heading>
                  <Text color={colors.deepForest} fontSize="15px" lineHeight="1.8" mb={4}>
                    OpenAI's structured outputs API intelligently processes video segments to extract and structure:
                  </Text>
                  <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                    <VStack align="start" spacing={2}>
                      <Text fontWeight="600" color={colors.deepForest}>• Ingredients & Substitutes</Text>
                      <Text fontWeight="600" color={colors.deepForest}>• Nutritional Claims</Text>
                      <Text fontWeight="600" color={colors.deepForest}>• Cooking Techniques</Text>
                    </VStack>
                    <VStack align="start" spacing={2}>
                      <Text fontWeight="600" color={colors.deepForest}>• Equipment Used</Text>
                      <Text fontWeight="600" color={colors.deepForest}>• Health Benefits</Text>
                      <Text fontWeight="600" color={colors.deepForest}>• Storage Methods</Text>
                    </VStack>
                  </Grid>
                </Box>

                {/* Phase 3: Graph Construction */}
                <Box
                  p={8}
                  bg={colors.cream}
                  borderRadius="20px"
                  borderLeft={`6px solid ${colors.limeGlow}`}
                  w="100%"
                >
                  <Heading size="md" mb={4} color={colors.forestShadow} fontSize="22px">
                    📊 Phase 3: Knowledge Graph Construction
                  </Heading>
                  <Text color={colors.deepForest} fontSize="15px" lineHeight="1.8" mb={4}>
                    Neo4j database automatically deduplicates and links entities across videos:
                  </Text>
                  <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                    <VStack align="start" spacing={2}>
                      <Text fontWeight="600" color={colors.deepForest}>• Entity Deduplication</Text>
                      <Text fontWeight="600" color={colors.deepForest}>• Relationship Mapping</Text>
                      <Text fontWeight="600" color={colors.deepForest}>• Contradiction Detection</Text>
                    </VStack>
                    <VStack align="start" spacing={2}>
                      <Text fontWeight="600" color={colors.deepForest}>• Cross-Video Linking</Text>
                      <Text fontWeight="600" color={colors.deepForest}>• Real-time Updates</Text>
                      <Text fontWeight="600" color={colors.deepForest}>• Semantic Indexing</Text>
                    </VStack>
                  </Grid>
                </Box>

                {/* Phase 4: Intelligent Query */}
                <Box
                  p={8}
                  bg={colors.cream}
                  borderRadius="20px"
                  borderLeft={`6px solid ${colors.limeGlow}`}
                  w="100%"
                >
                  <Heading size="md" mb={4} color={colors.forestShadow} fontSize="22px">
                    🔍 Phase 4: Semantic Search & Query
                  </Heading>
                  <Text color={colors.deepForest} fontSize="15px" lineHeight="1.8" mb={4}>
                    Ask natural language questions and get precise answers powered by graph traversal:
                  </Text>
                  <VStack align="start" spacing={3}>
                    <Text fontWeight="600" color={colors.deepForest}>💬 "What ingredients are used in high-protein recipes?"</Text>
                    <Text fontWeight="600" color={colors.deepForest}>💬 "Which videos contain low-carb meal prep ideas?"</Text>
                    <Text fontWeight="600" color={colors.deepForest}>💬 "Show me conflicting nutritional claims about quinoa"</Text>
                  </VStack>
                </Box>
              </VStack>
            </VStack>
          </Box>
        </Flex>
      </Box>

      {/* Data Flow Section */}
      <Box py={{ base: 20, md: 32 }} bg={colors.cream}>
        <Flex justify="center">
          <Box w="100%" px={{ base: 4, md: 8, lg: 12 }}>
            <VStack spacing={16}>
              <ScrollRevealBox w="100%">
                <VStack spacing={6} textAlign="center">
                  <Box
                    px={4}
                    py={2}
                    bg={colors.sageMist}
                    borderRadius="9999px"
                    display="inline-block"
                  >
                    <Text fontSize="13px" fontWeight="700" textTransform="uppercase" color={colors.deepForest} letterSpacing="0.08em">
                      System Flow
                    </Text>
                  </Box>
                  <Heading fontSize={{ base: "42px", md: "56px" }} fontWeight="400" color={colors.forestShadow} fontFamily="system-ui" lineHeight="1.1">
                    Complete Data Pipeline
                  </Heading>
                </VStack>
              </ScrollRevealBox>

              <ScrollRevealBox w="100%">
                <InteractiveTabs />
              </ScrollRevealBox>
            </VStack>
          </Box>
        </Flex>
      </Box>

      {/* Features Comparison */}
      <Box py={{ base: 20, md: 32 }} bg={colors.sageMist}>
        <Flex justify="center">
          <Box w="100%" px={{ base: 4, md: 8, lg: 12 }}>
            <VStack spacing={16}>
              <ScrollRevealBox w="100%">
                <VStack spacing={6} textAlign="center">
                  <Box
                    px={4}
                    py={2}
                    bg={`rgba(216, 229, 214, 0.6)`}
                  borderRadius="9999px"
                  display="inline-block"
                >
                  <Text fontSize="13px" fontWeight="700" textTransform="uppercase" color={colors.deepForest} letterSpacing="0.08em">
                    Capabilities Matrix
                  </Text>
                </Box>
                <Heading fontSize={{ base: "42px", md: "56px" }} fontWeight="400" color={colors.forestShadow} fontFamily="system-ui" lineHeight="1.1">
                  What You Can Do
                </Heading>
              </VStack>
              </ScrollRevealBox>

              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }} gap={6} w="100%">
                {[
                  { emoji: "🔗", title: "Relationship Discovery", desc: "Find connections between ingredients, techniques, and nutritional outcomes" },
                  { emoji: "🔍", title: "Semantic Search", desc: "Search using natural language questions instead of keywords" },
                  { emoji: "⚡", title: "Real-time Analysis", desc: "Get instant insights as new videos are uploaded" },
                  { emoji: "📈", title: "Trend Analysis", desc: "Identify trending ingredients and techniques across creators" },
                  { emoji: "🎯", title: "Personalized Recommendations", desc: "Get meal prep suggestions based on dietary preferences" },
                  { emoji: "✅", title: "Claim Verification", desc: "Cross-reference health claims across multiple sources" }
                ].map((feature, i) => (
                  <ScrollRevealBox key={i} style={{ transitionDelay: `${i * 75}ms` }}>
                  <Box
                    p={6}
                    bg={colors.cream}
                    borderRadius="16px"
                    textAlign="center"
                    transition="all 0.3s"
                    _hover={{ transform: "translateY(-4px)", boxShadow: "0 12px 32px rgba(0, 71, 60, 0.1)" }}
                  >
                    <Box fontSize="32px" mb={3}>{feature.emoji}</Box>
                    <Heading size="sm" mb={2} color={colors.forestShadow} fontSize="16px">
                      {feature.title}
                    </Heading>
                    <Text fontSize="13px" color={colors.deepForest} opacity={0.75} lineHeight="1.5">
                      {feature.desc}
                    </Text>
                  </Box>
                  </ScrollRevealBox>
                ))}
              </Grid>
            </VStack>
          </Box>
        </Flex>
      </Box>

      {/* FAQ Section */}
      <Box py={{ base: 20, md: 32 }} bg={colors.cream}>
        <Flex justify="center">
          <Box w="100%" px={{ base: 4, md: 8, lg: 12 }}>
            <VStack spacing={16}>
              <ScrollRevealBox>
                <VStack spacing={6} textAlign="center">
                  <Box
                    px={4}
                    py={2}
                    bg={colors.sageMist}
                    borderRadius="9999px"
                    display="inline-block"
                  >
                    <Text fontSize="13px" fontWeight="700" textTransform="uppercase" color={colors.deepForest} letterSpacing="0.08em">
                      Questions
                    </Text>
                  </Box>
                  <Heading fontSize={{ base: "42px", md: "56px" }} fontWeight="400" color={colors.forestShadow} fontFamily="system-ui" lineHeight="1.1">
                    Frequently Asked Questions
                  </Heading>
                </VStack>
              </ScrollRevealBox>

              <VStack spacing={4} w="100%">
                {[
                  {
                    q: "What video formats are supported?",
                    a: "We support YouTube videos, Vimeo links, and local file uploads (MP4, MOV, WebM). Videos are processed in real-time."
                  },
                  {
                    q: "How long does it take to analyze a video?",
                    a: "A typical 10-minute meal prep video is analyzed in 30-60 seconds. The time depends on video length and complexity."
                  },
                  {
                    q: "Can I export the data?",
                    a: "Yes! You can export extracted entities as JSON, query results as CSV, or access everything via our REST API."
                  },
                  {
                    q: "Is my data private?",
                    a: "All video data is processed securely. We don't store raw videos, only extracted metadata in our encrypted database."
                  },
                  {
                    q: "Can I integrate this with my own app?",
                    a: "Absolutely! We provide a complete REST API with authentication, rate limiting, and webhook support for integration."
                  },
                  {
                    q: "What about accuracy of AI extraction?",
                    a: "Our system achieves 95%+ accuracy on entity extraction. All claims and nutritional information are flagged for verification."
                  }
                ].map((faq, i) => (
                  <FAQItem key={i} question={faq.q} answer={faq.a} index={i} />
                ))}
              </VStack>
            </VStack>
          </Box>
        </Flex>
      </Box>

      {/* Stats Section */}
      <Box py={{ base: 20, md: 32 }} bg={colors.sageMist}>
        <Flex justify="center">
          <Box w="100%" px={{ base: 4, md: 8, lg: 12 }}>
            <VStack spacing={16}>
              <ScrollRevealBox textAlign="center">
                <VStack spacing={6}>
                  <Box
                    px={4}
                    py={2}
                    bg={`rgba(216, 229, 214, 0.6)`}
                    borderRadius="9999px"
                    display="inline-block"
                  >
                    <Text fontSize="13px" fontWeight="700" textTransform="uppercase" color={colors.deepForest} letterSpacing="0.08em">
                      Impact
                    </Text>
                  </Box>
                  <Heading fontSize={{ base: "42px", md: "56px" }} fontWeight="400" color={colors.forestShadow} fontFamily="system-ui" lineHeight="1.1">
                    Proven Results
                  </Heading>
                </VStack>
              </ScrollRevealBox>

              <Grid templateColumns={{ base: "1fr", md: "repeat(auto-fit, minmax(280px, 1fr))" }} gap={6} w="100%">
                {[
                  { label: "Videos Analyzed", value: 500, suffix: "+" },
                  { label: "Entities Extracted", value: 50000, suffix: "+" },
                  { label: "Accuracy Rate", value: 95, suffix: "%" }
                ].map((stat, i) => (
                  <ScrollRevealBox key={i} style={{ transitionDelay: `${i * 100}ms` }}>
                    <Box
                      p={8}
                      bg={colors.cream}
                      borderRadius="20px"
                      textAlign="center"
                      borderTop={`4px solid ${colors.limeGlow}`}
                      transition="all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
                      _hover={{
                        transform: "translateY(-8px)",
                        boxShadow: "0 16px 40px rgba(0, 71, 60, 0.12)"
                      }}
                    >
                      <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                      <Text fontSize="16px" fontWeight="600" color={colors.deepForest} mt={4}>
                        {stat.label}
                      </Text>
                    </Box>
                  </ScrollRevealBox>
                ))}
              </Grid>
            </VStack>
          </Box>
        </Flex>
      </Box>

      {/* Getting Started Section */}
      <Box py={{ base: 20, md: 32 }} bg={colors.warmSand}>
        <Flex justify="center">
          <Box w="100%" px={{ base: 4, md: 8, lg: 12 }}>
            <VStack spacing={16}>
              <ScrollRevealBox w="100%">
                <VStack spacing={6} textAlign="center">
                  <Box
                    px={4}
                    py={2}
                    bg={`rgba(232, 220, 198, 0.6)`}
                    borderRadius="9999px"
                    display="inline-block"
                  >
                    <Text fontSize="13px" fontWeight="700" textTransform="uppercase" color={colors.deepForest} letterSpacing="0.08em">
                      Quick Start
                    </Text>
                  </Box>
                  <Heading fontSize={{ base: "42px", md: "56px" }} fontWeight="400" color={colors.forestShadow} fontFamily="system-ui" lineHeight="1.1">
                    Get Started in 3 Steps
                  </Heading>
                </VStack>
              </ScrollRevealBox>

              <Grid templateColumns={{ base: "1fr", md: "repeat(auto-fit, minmax(280px, 1fr))" }} gap={6} w="100%">
                {[
                  { num: "1", icon: "📸", title: "Find a Video", desc: "Select any meal prep video from YouTube or upload your own" },
                  { num: "2", icon: "⚙️", title: "Let AI Analyze", desc: "Our system automatically extracts entities and builds the graph" },
                  { num: "3", icon: "💬", title: "Ask Questions", desc: "Use natural language to explore the video content" }
                ].map((step, i) => (
                  <ScrollRevealBox key={i} style={{ transitionDelay: `${i * 100}ms` }}>
                    <Box
                      p={7}
                      bg={colors.sageMist}
                      borderRadius="20px"
                      textAlign="center"
                      transition="all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
                      position="relative"
                      overflow="hidden"
                      _hover={{
                        transform: "translateY(-8px)",
                        boxShadow: "0 20px 50px rgba(0, 71, 60, 0.15)"
                      }}
                    >
                      {/* Glow effect on hover */}
                      <Box
                        position="absolute"
                        top={-20}
                        right={-20}
                        w={80}
                        h={80}
                        bg={`radial-gradient(circle, ${colors.limeGlow}20 0%, transparent 70%)`}
                        borderRadius="full"
                        transition="all 0.3s"
                        opacity={0}
                        _groupHover={{ opacity: 1 }}
                      />
                      <Box
                        w={16}
                        h={16}
                        bg={colors.limeGlow}
                        borderRadius="full"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        color={colors.deepForest}
                        fontWeight="700"
                        fontSize="20px"
                        mx="auto"
                        mb={5}
                        transition="all 0.3s"
                        _groupHover={{
                          transform: "scale(1.1)",
                          boxShadow: `0 8px 24px rgba(230, 255, 85, 0.4)`
                        }}
                        position="relative"
                        zIndex={1}
                      >
                        {step.num}
                      </Box>
                      <Box fontSize="36px" mb={3} position="relative" zIndex={1}>
                        {step.icon}
                      </Box>
                      <Heading size="sm" mb={3} color={colors.forestShadow} fontSize="18px" position="relative" zIndex={1}>
                        {step.title}
                      </Heading>
                      <Text fontSize="14px" color={colors.deepForest} opacity={0.85} lineHeight="1.5" position="relative" zIndex={1}>
                        {step.desc}
                      </Text>
                    </Box>
                  </ScrollRevealBox>
                ))}
              </Grid>

              {/* Connection lines between steps (desktop only) */}
              <Box
                w="100%"
                display={{ base: "none", md: "block" }}
                mt={-4}
                mb={8}
                position="relative"
                h="4px"
              >
                <Box
                  position="absolute"
                  top="50%"
                  left="20%"
                  right="20%"
                  h="2px"
                  bg={`linear-gradient(90deg, transparent 0%, ${colors.limeGlow} 50%, transparent 100%)`}
                  transform="translateY(-50%)"
                  style={{
                    animation: `slideRight 2s ease-in-out infinite`
                  }}
                />
              </Box>
            </VStack>
          </Box>
        </Flex>
      </Box>

      {/* CTA Section */}
      <Box py={{ base: 24, md: 32 }} bg={colors.deepForest} color="white" position="relative" overflow="hidden">
        <Box position="absolute" top={0} left={0} w="100%" h="100%" bg={`linear-gradient(135deg, rgba(230, 255, 85, 0.08) 0%, transparent 100%)`} />
        <Flex justify="center" position="relative" zIndex={1}>
          <Box w="100%" px={{ base: 4, md: 8, lg: 12 }} textAlign="center">
            <VStack spacing={10}>
            <Heading fontSize={{ base: "48px", md: "64px" }} fontWeight="300" lineHeight="1.1" fontFamily="system-ui">
              Ready to Transform Your Meal Prep?
            </Heading>
            <Text fontSize={{ base: "18px", md: "20px" }} opacity={0.9} lineHeight="1.5" maxW="600px" mx="auto">
              Upload a meal prep video and explore the interactive knowledge graph powered by AI.
            </Text>
            <Button
              size="lg"
              bg={colors.limeGlow}
              color={colors.deepForest}
              borderRadius="9999px"
              px={8}
              py={4}
              h="auto"
              fontWeight="700"
              fontSize="17px"
              rightIcon={<ChevronRight size={22} />}
              onClick={onLaunch}
              _hover={{ transform: "translateY(-3px)", boxShadow: "0 12px 36px rgba(230, 255, 85, 0.35)" }}
              _active={{ transform: "translateY(-1px)" }}
              transition="all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
            >
              Launch Application
            </Button>
            </VStack>
          </Box>
        </Flex>
      </Box>

      {/* Footer */}
      <Box bg={colors.forestShadow} color={colors.sageMist} py={10}>
        <Flex justify="center">
          <Box w="100%" px={{ base: 4, md: 8, lg: 12 }} textAlign="center" fontSize="sm">
            <Text opacity={0.8}>
              Meal Prep Video Context Graph • Powered by TwelveLabs, OpenAI & Neo4j
            </Text>
          </Box>
        </Flex>
      </Box>
    </Box>
  );
}
