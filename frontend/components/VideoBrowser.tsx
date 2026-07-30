"use client";

import { useEffect, useRef, useState } from "react";
import {
  Box, Flex, Text, Heading, VStack, HStack, Badge, Spinner, Button,
} from "@chakra-ui/react";
import { Play, Film } from "lucide-react";
import { API_BASE } from "@/lib/config";

// Sweetgreen Design Tokens
const sweetgreenColors = {
  cream: "#f4f3e7",
  deepForest: "#00473c",
  limeGlow: "#e6ff55",
  sageMist: "#d8e5d6",
  warmSand: "#e8dcc6",
  forestShadow: "#0e150e",
};

interface Video {
  id: string;
  title: string;
  url: string;
  duration_sec: number | null;
  summary: string;
  segment_count: number;
}

interface Segment {
  id: string;
  start_sec: number | null;
  end_sec: number | null;
  summary: string;
  on_screen_text: string;
  segment_type?: string;
  entities?: string[];
  ingredient_entities?: string[];
  techniques?: string[];
  cooking_temp?: string;
  cooking_time_min?: number;
  cooking_time_sec?: number;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  allergens?: string[];
  yield_servings?: number;
  storage_method?: string;
  storage_duration?: string;
  nutritional_claim?: string;
}

function fmt(sec: number | null): string {
  if (sec == null) return "--:--";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface VideoBrowserProps {
  onViewDetails?: (videoId: string) => void;
}

export function VideoBrowser({ onViewDetails }: VideoBrowserProps = {}) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Video | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [segLoading, setSegLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/videos`, { signal: AbortSignal.timeout(10000) });
        const data = await res.json();
        setVideos(data.videos || []);
      } catch {
        setError("Unable to load videos. Is the backend running and the graph seeded?");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function openVideo(v: Video) {
    setSelected(v);
    setSegments([]);
    setSegLoading(true);
    try {
      const res = await fetch(`${API_BASE}/videos/${encodeURIComponent(v.id)}/segments`, {
        signal: AbortSignal.timeout(10000),
      });
      const data = await res.json();
      setSegments(data.segments || []);
    } catch {
      /* ignore */
    } finally {
      setSegLoading(false);
    }
  }

  function seekTo(sec: number | null) {
    if (sec == null || !videoRef.current) return;
    videoRef.current.currentTime = sec;
    videoRef.current.play().catch(() => {});
  }

  if (loading) {
    return (
      <Flex h="100%" align="center" justify="center">
        <Spinner size="sm" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex h="100%" align="center" justify="center" p={6}>
        <Text color="gray.500" fontSize="sm" textAlign="center">{error}</Text>
      </Flex>
    );
  }

  if (selected) {
    return (
      <VStack align="stretch" h="100%" gap={0} bg={sweetgreenColors.warmSand}>
        <HStack px={4} py={3} borderBottom={`1px solid ${sweetgreenColors.sageMist}`} bg={sweetgreenColors.warmSand} justify="space-between">
          <Button size="xs" variant="ghost" color={sweetgreenColors.deepForest} onClick={() => setSelected(null)}>← All videos</Button>
          {onViewDetails && (
            <Button
              size="xs"
              bg={sweetgreenColors.limeGlow}
              color={sweetgreenColors.deepForest}
              onClick={() => onViewDetails(selected!.id)}
            >
              📊 Details
            </Button>
          )}
        </HStack>
        <Box px={4} py={3}>
          <Heading size="sm" mb={2} color={sweetgreenColors.deepForest}>{selected.title}</Heading>
          {
            // Use direct video URL from database, or construct from filename
            <video
              ref={videoRef}
              src={selected.url || `${API_BASE.replace("/api", "")}/videos/${encodeURIComponent(selected.title.replace(/\s+/g, "_"))}.mp4`}
              controls
              style={{ width: "100%", borderRadius: 6 }}
            />
          }
          {selected.summary && (
            <Text fontSize="xs" color="gray.600" mt={2}>{selected.summary}</Text>
          )}
        </Box>
        <Box flex={1} overflow="auto" px={4} pb={4} bg={sweetgreenColors.warmSand}>
          <Text fontSize="xs" fontWeight="bold" color={sweetgreenColors.deepForest} mb={2}>
            SEGMENTS {segLoading && <Spinner size="xs" ml={2} />}
          </Text>
          <VStack align="stretch" gap={2}>
            {segments.map((s) => (
              <Box
                key={s.id}
                p={3}
                bg={sweetgreenColors.sageMist}
                borderRadius="12px"
                borderWidth="1px"
                borderColor={sweetgreenColors.sageMist}
                cursor="pointer"
                transition="all 0.2s"
                _hover={{ borderColor: sweetgreenColors.limeGlow, boxShadow: `0 4px 12px rgba(230, 255, 85, 0.15)` }}
                onClick={() => seekTo(s.start_sec)}
              >
                <HStack justify="space-between" mb={2}>
                  <Badge size="sm" bg={sweetgreenColors.limeGlow} color={sweetgreenColors.deepForest}>
                    <Play size={9} /> {fmt(s.start_sec)}–{fmt(s.end_sec)}
                  </Badge>
                  {s.segment_type && (
                    <Badge size="xs" bg={sweetgreenColors.deepForest} color="white">
                      {s.segment_type.replace("_", " ")}
                    </Badge>
                  )}
                </HStack>
                <Text fontSize="xs" color={sweetgreenColors.deepForest} fontWeight="500" mb={2}>{s.summary}</Text>

                {/* Nutritional Info */}
                {s.calories > 0 && (
                  <HStack fontSize="xs" gap={2} mb={2} color={sweetgreenColors.deepForest} opacity={0.85}>
                    <Text>🔥 {s.calories} cal</Text>
                    {s.protein_g > 0 && <Text>•</Text>}
                    {s.protein_g > 0 && <Text>🥚 {s.protein_g}g protein</Text>}
                    {s.carbs_g > 0 && <Text>•</Text>}
                    {s.carbs_g > 0 && <Text>🌾 {s.carbs_g}g carbs</Text>}
                    {s.fat_g > 0 && <Text>•</Text>}
                    {s.fat_g > 0 && <Text>🫒 {s.fat_g}g fat</Text>}
                  </HStack>
                )}

                {/* Cooking Details */}
                {(s.cooking_temp || s.cooking_time_min || s.cooking_time_sec) && (
                  <HStack fontSize="xs" gap={2} mb={2} color={sweetgreenColors.deepForest} opacity={0.85}>
                    {s.cooking_temp && <Text>🌡️ {s.cooking_temp}</Text>}
                    {(s.cooking_time_min || s.cooking_time_sec) && (
                      <Text>⏱️ {s.cooking_time_min}m {s.cooking_time_sec}s</Text>
                    )}
                  </HStack>
                )}

                {/* Ingredients, Techniques, and Allergens */}
                {(s.ingredient_entities?.length > 0 || s.techniques?.length > 0 || s.allergens?.length > 0) && (
                  <VStack gap={1} align="start" mb={2}>
                    {s.ingredient_entities?.length > 0 && (
                      <HStack gap={1} flexWrap="wrap">
                        {s.ingredient_entities.slice(0, 3).map((ing) => (
                          <Badge key={ing} size="xs" bg="rgba(230, 255, 85, 0.3)" color={sweetgreenColors.deepForest}>
                            {ing}
                          </Badge>
                        ))}
                        {s.ingredient_entities.length > 3 && (
                          <Text fontSize="xs" color={sweetgreenColors.deepForest} opacity={0.7}>
                            +{s.ingredient_entities.length - 3} more
                          </Text>
                        )}
                      </HStack>
                    )}
                    {s.techniques?.length > 0 && (
                      <HStack gap={1} flexWrap="wrap">
                        {s.techniques.slice(0, 2).map((t) => (
                          <Badge key={t} size="xs" variant="subtle" color={sweetgreenColors.deepForest}>
                            {t}
                          </Badge>
                        ))}
                      </HStack>
                    )}
                    {s.allergens?.length > 0 && (
                      <Text fontSize="xs" color="#ef4444" fontWeight="500">
                        ⚠️ Allergens: {s.allergens.join(", ")}
                      </Text>
                    )}
                  </VStack>
                )}

                {/* Storage and Yield */}
                {(s.storage_method || s.yield_servings) && (
                  <HStack fontSize="xs" gap={2} color={sweetgreenColors.deepForest} opacity={0.85}>
                    {s.storage_method && <Text>📦 {s.storage_method}</Text>}
                    {s.yield_servings > 0 && <Text>🍽️ {s.yield_servings} servings</Text>}
                  </HStack>
                )}

                {/* Generic Entities */}
                {s.entities?.filter(e => !s.ingredient_entities?.includes(e))?.length > 0 && (
                  <HStack gap={1} mt={2} flexWrap="wrap">
                    {s.entities.filter(e => !s.ingredient_entities?.includes(e)).map((e) => (
                      <Badge key={e} size="xs" style={{ backgroundColor: sweetgreenColors.deepForest, color: "white" }}>
                        {e}
                      </Badge>
                    ))}
                  </HStack>
                )}
              </Box>
            ))}
            {!segLoading && segments.length === 0 && (
              <Text fontSize="xs" color={sweetgreenColors.deepForest} opacity={0.6}>No segments.</Text>
            )}
          </VStack>
        </Box>
      </VStack>
    );
  }

  return (
    <Box h="100%" overflow="auto" p={4} bg={sweetgreenColors.warmSand}>
      <Text fontSize="xs" fontWeight="bold" color={sweetgreenColors.deepForest} mb={3}>
        VIDEOS ({videos.length})
      </Text>
      {videos.length === 0 ? (
        <Flex direction="column" align="center" justify="center" py={10} gap={2} color={sweetgreenColors.deepForest} opacity={0.6}>
          <Film size={32} />
          <Text fontSize="sm" textAlign="center">No videos yet.<br />Run <code>make seed</code> to ingest.</Text>
        </Flex>
      ) : (
        <VStack align="stretch" gap={3}>
          {videos.map((v) => (
            <Box
              key={v.id}
              p={3}
              borderWidth="1px"
              borderColor={sweetgreenColors.sageMist}
              borderRadius="12px"
              bg={sweetgreenColors.sageMist}
              cursor="pointer"
              transition="all 0.2s"
              _hover={{ borderColor: sweetgreenColors.limeGlow, boxShadow: `0 4px 12px rgba(230, 255, 85, 0.15)` }}
              onClick={() => openVideo(v)}
            >
              <HStack justify="space-between">
                <Heading size="xs" color={sweetgreenColors.deepForest}>{v.title}</Heading>
                <Badge size="sm" bg={sweetgreenColors.limeGlow} color={sweetgreenColors.deepForest}>{v.segment_count} seg</Badge>
              </HStack>
              {v.summary && (
                <Text fontSize="xs" color={sweetgreenColors.deepForest} opacity={0.8} mt={2} lineClamp={2}>{v.summary}</Text>
              )}
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );
}
