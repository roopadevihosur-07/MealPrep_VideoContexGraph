"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Box, Flex, Heading, Text, IconButton, HStack, Spinner } from "@chakra-ui/react";
import { MessageSquare, Network, FileText } from "lucide-react";
import dynamic from "next/dynamic";
import { LandingPage } from "@/components/LandingPage";
import { MealPrepDashboard } from "@/components/MealPrepDashboard";
import { ChatInterface } from "@/components/ChatInterface";
const ContextGraphView = dynamic(
  () => import("@/components/ContextGraphView").then((mod) => mod.ContextGraphView),
  {
    ssr: false,
    loading: () => (
      <Flex align="center" justify="center" h="100%" color="gray.400">
        <Spinner size="lg" />
      </Flex>
    ),
  }
);
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { VideoBrowser } from "@/components/VideoBrowser";
import { DOMAIN, API_BASE } from "@/lib/config";
import type { GraphData } from "@/lib/config";

type PanelId = "chat" | "graph" | "details";

// Sweetgreen Design Tokens
const sweetgreenColors = {
  cream: "#f4f3e7",
  deepForest: "#00473c",
  limeGlow: "#e6ff55",
  sageMist: "#d8e5d6",
  warmSand: "#e8dcc6",
  forestShadow: "#0e150e",
};

function ResizeHandle({ onDrag }: { onDrag: (delta: number) => void }) {
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      function onMouseMove(ev: MouseEvent) {
        onDrag(ev.clientX - startX);
      }
      function onMouseUp() {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [onDrag],
  );

  return (
    <Box
      w="1px"
      cursor="col-resize"
      bg="transparent"
      _hover={{ bg: sweetgreenColors.limeGlow }}
      transition="background 0.15s"
      flexShrink={0}
      display={{ base: "none", lg: "block" }}
      onMouseDown={handleMouseDown}
    />
  );
}

export default function Home() {
  const [showLandingPage, setShowLandingPage] = useState(true);
  const [mealPrepVideoId, setMealPrepVideoId] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [activePanel, setActivePanel] = useState<PanelId>("chat");
  const [backendStatus, setBackendStatus] = useState<"ok" | "degraded" | "offline">("offline");
  const [leftWidth, setLeftWidth] = useState(400);
  const [rightWidth, setRightWidth] = useState(350);
  const leftBaseRef = useRef(400);
  const rightBaseRef = useRef(350);

  const [askAboutInput, setAskAboutInput] = useState<string | null>(null);

  const handleGraphUpdate = useCallback((data: GraphData) => {
    setGraphData(data);
  }, []);

  const handleAskAbout = useCallback((entityName: string) => {
    setAskAboutInput(`Tell me about ${entityName}`);
    setActivePanel("chat");
  }, []);

  // Poll backend health every 60 seconds with retry on initial load
  useEffect(() => {
    async function checkHealth(retries = 3, delay = 1000) {
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          const res = await fetch(`${API_BASE.replace("/api", "")}/health`, {
            signal: AbortSignal.timeout(5000),
          });
          const data = await res.json();
          setBackendStatus(data.status === "ok" ? "ok" : "degraded");
          return;
        } catch {
          if (attempt < retries - 1) {
            await new Promise(r => setTimeout(r, delay * (attempt + 1)));
          }
        }
      }
      setBackendStatus("offline");
    }
    checkHealth();
    const interval = setInterval(() => checkHealth(1), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLeftDrag = useCallback((delta: number) => {
    setLeftWidth(Math.min(600, Math.max(280, leftBaseRef.current + delta)));
  }, []);

  const handleRightDrag = useCallback((delta: number) => {
    setRightWidth(Math.min(600, Math.max(280, rightBaseRef.current - delta)));
  }, []);

  // Update base refs when drag ends (width stabilizes)
  useEffect(() => {
    leftBaseRef.current = leftWidth;
  }, [leftWidth]);
  useEffect(() => {
    rightBaseRef.current = rightWidth;
  }, [rightWidth]);

  if (showLandingPage) {
    return <LandingPage onLaunch={() => setShowLandingPage(false)} />;
  }

  if (mealPrepVideoId) {
    return <MealPrepDashboard videoId={mealPrepVideoId} onBack={() => setMealPrepVideoId(null)} />;
  }

  return (
    <Flex direction="column" h="100dvh" bg={sweetgreenColors.cream}>
      {/* Header */}
      <Flex
        bg={sweetgreenColors.deepForest}
        color="white"
        px={8}
        py={4}
        justify="space-between"
        align="center"
        borderBottom={`1px solid rgba(230, 255, 85, 0.1)`}
      >
        <Box>
          <Heading size="md" fontFamily="system-ui" fontWeight="600">
            🎬 {DOMAIN.name}
          </Heading>
          <Text fontSize="sm" color={sweetgreenColors.limeGlow} opacity={0.8}>
            {DOMAIN.tagline}
          </Text>
        </Box>
        <HStack gap={3}>
          <Box
            w={3}
            h={3}
            borderRadius="full"
            bg={
              backendStatus === "ok"
                ? sweetgreenColors.limeGlow
                : backendStatus === "degraded"
                  ? "#fbbf24"
                  : "#ef4444"
            }
            title={
              backendStatus === "ok"
                ? "Backend connected"
                : backendStatus === "degraded"
                  ? "Backend connected (Neo4j unavailable)"
                  : "Backend offline"
            }
          />
          <Text fontSize="xs" color={sweetgreenColors.sageMist} opacity={0.8}>
            {backendStatus === "ok"
              ? "Connected"
              : backendStatus === "degraded"
                ? "Degraded"
                : "Offline"}
          </Text>
        </HStack>
      </Flex>

      {/* Main content - 3 panel layout */}
      <Flex as="main" flex={1} overflow="hidden" bg={sweetgreenColors.cream}>
        {/* Left panel: Chat */}
        <Box
          as="section"
          aria-label="Chat"
          w={{ base: "100%", lg: `${leftWidth}px` }}
          minW={{ lg: "280px" }}
          overflow="auto"
          flexShrink={0}
          display={{ base: activePanel === "chat" ? "block" : "none", lg: "block" }}
          bg={sweetgreenColors.cream}
          borderRight={`1px solid ${sweetgreenColors.sageMist}`}
        >
          <ChatInterface
              onGraphUpdate={handleGraphUpdate}
              externalInput={askAboutInput}
              onExternalInputConsumed={() => setAskAboutInput(null)}
            />
        </Box>

        <ResizeHandle onDrag={handleLeftDrag} />

        {/* Center panel: Graph visualization */}
        <Box
          as="section"
          aria-label="Graph visualization"
          flex={1}
          bg={sweetgreenColors.sageMist}
          display={{ base: activePanel === "graph" ? "block" : "none", lg: "block" }}
        >
          <ErrorBoundary fallbackMessage="Graph visualization error">
            <ContextGraphView externalGraphData={graphData} onAskAbout={handleAskAbout} />
          </ErrorBoundary>
        </Box>

        <ResizeHandle onDrag={handleRightDrag} />

        {/* Right panel: Decision traces + Documents */}
        <Box
          as="aside"
          aria-label="Details"
          w={{ base: "100%", lg: `${rightWidth}px` }}
          minW={{ lg: "280px" }}
          overflow="hidden"
          flexShrink={0}
          display={{ base: activePanel === "details" ? "block" : "none", lg: "block" }}
          bg={sweetgreenColors.warmSand}
          borderLeft={`1px solid ${sweetgreenColors.sageMist}`}
        >
          <Flex direction="column" h="100%">
            <Box px={6} py={4} borderBottom={`1px solid ${sweetgreenColors.sageMist}`} bg={sweetgreenColors.warmSand}>
              <Heading size="sm" color={sweetgreenColors.deepForest} fontFamily="system-ui">
                Videos
              </Heading>
            </Box>
            <Box flex={1} overflow="hidden">
              <VideoBrowser onViewDetails={(videoId) => setMealPrepVideoId(videoId)} />
            </Box>
          </Flex>
        </Box>
      </Flex>

      {/* Mobile bottom tab bar — hidden on desktop */}
      <HStack
        display={{ base: "flex", lg: "none" }}
        justify="space-around"
        py={3}
        borderTop={`1px solid ${sweetgreenColors.sageMist}`}
        bg={sweetgreenColors.cream}
      >
        <IconButton
          aria-label="Chat panel"
          variant={activePanel === "chat" ? "solid" : "ghost"}
          size="sm"
          color={activePanel === "chat" ? sweetgreenColors.deepForest : sweetgreenColors.deepForest}
          bg={activePanel === "chat" ? sweetgreenColors.limeGlow : "transparent"}
          _hover={{ bg: activePanel === "chat" ? sweetgreenColors.limeGlow : sweetgreenColors.sageMist }}
          onClick={() => setActivePanel("chat")}
        >
          <MessageSquare size={20} />
        </IconButton>
        <IconButton
          aria-label="Graph panel"
          variant={activePanel === "graph" ? "solid" : "ghost"}
          size="sm"
          color={activePanel === "graph" ? sweetgreenColors.deepForest : sweetgreenColors.deepForest}
          bg={activePanel === "graph" ? sweetgreenColors.limeGlow : "transparent"}
          _hover={{ bg: activePanel === "graph" ? sweetgreenColors.limeGlow : sweetgreenColors.sageMist }}
          onClick={() => setActivePanel("graph")}
        >
          <Network size={20} />
        </IconButton>
        <IconButton
          aria-label="Details panel"
          variant={activePanel === "details" ? "solid" : "ghost"}
          size="sm"
          color={activePanel === "details" ? sweetgreenColors.deepForest : sweetgreenColors.deepForest}
          bg={activePanel === "details" ? sweetgreenColors.limeGlow : "transparent"}
          _hover={{ bg: activePanel === "details" ? sweetgreenColors.limeGlow : sweetgreenColors.sageMist }}
          onClick={() => setActivePanel("details")}
        >
          <FileText size={20} />
        </IconButton>
      </HStack>
    </Flex>
  );
}
