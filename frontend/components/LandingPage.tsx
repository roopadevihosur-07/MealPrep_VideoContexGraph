"use client";

import { Box, Button, Container, Flex, Heading, Text, VStack, HStack, Grid, Icon } from "@chakra-ui/react";
import { ChevronRight, Video, Brain, Database, Zap, Users, BarChart3, Leaf } from "lucide-react";
import { ReactNode, useState, useEffect } from "react";

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
    >
      {name}
    </Flex>
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
    <Box bg={colors.cream} minH="100vh" color={colors.forestShadow} overflowX="hidden">
      {/* Hero Section */}
      <Box bg={colors.cream} pt={{ base: 16, md: 32 }} pb={{ base: 20, md: 40 }} position="relative" overflow="hidden">
        <MealPrepBackground />
        <Box position="absolute" top={0} right={0} w="40%" h="100%" bg={`linear-gradient(135deg, ${colors.limeGlow}15 0%, ${colors.sageMist}15 100%)`} />
        <Flex justify="center" position="relative" zIndex={2}>
          <VStack spacing={10} textAlign="center" w="100%" maxW="900px" px={{ base: 4, md: 6 }}>
            <Box
              px={4}
              py={2}
              bg={colors.sageMist}
              borderRadius="9999px"
              display="inline-block"
            >
              <Text fontSize="13px" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" color={colors.deepForest}>
                ✨ AI-Powered Video Intelligence
              </Text>
            </Box>

            <Heading
              as="h1"
              fontSize={{ base: "56px", md: "84px" }}
              fontWeight="300"
              lineHeight="0.95"
              color={colors.forestShadow}
              fontFamily="system-ui"
              letterSpacing="-0.02em"
            >
              Meal Prep Video
              <Box as="span" display="block" color={colors.deepForest}>
                Context Graph
              </Box>
            </Heading>

            <Text fontSize={{ base: "17px", md: "22px" }} maxW="700px" color={colors.deepForest} opacity={0.85} lineHeight="1.5" fontWeight="300">
              Transform cooking videos into interactive knowledge graphs. Understand recipes, nutritional claims, and meal prep strategies through AI-powered video analysis.
            </Text>

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
        </Flex>
      </Box>

      {/* Problem Section */}
      <Box bg={colors.sageMist} py={{ base: 20, md: 32 }}>
        <Flex justify="center">
          <Box w="100%" maxW="900px" px={{ base: 4, md: 6 }}>
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

            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={8}>
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
          <Box w="100%" maxW="900px" px={{ base: 4, md: 6 }}>
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
          <Box w="100%" maxW="900px" px={{ base: 4, md: 6 }}>
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

            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }} gap={8}>
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
          <Box w="100%" maxW="900px" px={{ base: 4, md: 6 }}>
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

            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr 1fr" }} gap={6}>
              {[
                { num: "1", title: "Upload", desc: "Add meal prep video from YouTube or local file" },
                { num: "2", title: "Analyze", desc: "TwelveLabs extracts segments & visual content" },
                { num: "3", title: "Structure", desc: "OpenAI identifies claims, entities & dependencies" },
                { num: "4", title: "Query", desc: "Ask questions about nutrition, ingredients & techniques" }
              ].map((step, i) => (
                <Box
                  key={i}
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
              ))}
            </Grid>
          </VStack>
          </Box>
        </Flex>
      </Box>

      {/* Use Cases */}
      <Box py={{ base: 20, md: 32 }} bg={colors.sageMist}>
        <Flex justify="center">
          <Box w="100%" maxW="900px" px={{ base: 4, md: 6 }}>
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

            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={8}>
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

      {/* CTA Section */}
      <Box py={{ base: 24, md: 32 }} bg={colors.deepForest} color="white" position="relative" overflow="hidden">
        <Box position="absolute" top={0} left={0} w="100%" h="100%" bg={`linear-gradient(135deg, rgba(230, 255, 85, 0.08) 0%, transparent 100%)`} />
        <Flex justify="center" position="relative" zIndex={1}>
          <Box w="100%" maxW="900px" px={{ base: 4, md: 6 }} textAlign="center">
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
          <Box w="100%" maxW="900px" px={{ base: 4, md: 6 }} textAlign="center" fontSize="sm">
            <Text opacity={0.8}>
              Meal Prep Video Context Graph • Powered by TwelveLabs, OpenAI & Neo4j
            </Text>
          </Box>
        </Flex>
      </Box>
    </Box>
  );
}
