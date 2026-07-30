"use client";

import { useEffect, useRef, useState } from "react";
import {
  Box, Flex, Text, Heading, VStack, HStack, Badge, Spinner, Button,
} from "@chakra-ui/react";
import { Play, Film } from "lucide-react";
import { API_BASE, NODE_COLORS } from "@/lib/config";

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
  entities: string[];
}

function fmt(sec: number | null): string {
  if (sec == null) return "--:--";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VideoBrowser() {
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
      <VStack align="stretch" h="100%" gap={0}>
        <HStack px={3} py={2} borderBottom="1px solid" borderColor="gray.200">
          <Button size="xs" variant="ghost" onClick={() => setSelected(null)}>← All videos</Button>
        </HStack>
        <Box px={3} py={2}>
          <Heading size="sm" mb={2}>{selected.title}</Heading>
          {
            // Use backend streaming endpoint if URL is not a full HTTP URL
            <video
              ref={videoRef}
              src={selected.url && selected.url.startsWith("http") ? selected.url : `${API_BASE.replace("/api", "")}/video/${encodeURIComponent(selected.id)}/stream`}
              controls
              style={{ width: "100%", borderRadius: 6 }}
            />
          }
          {selected.summary && (
            <Text fontSize="xs" color="gray.600" mt={2}>{selected.summary}</Text>
          )}
        </Box>
        <Box flex={1} overflow="auto" px={3} pb={3}>
          <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>
            SEGMENTS {segLoading && <Spinner size="xs" ml={2} />}
          </Text>
          <VStack align="stretch" gap={1.5}>
            {segments.map((s) => (
              <Box
                key={s.id}
                p={2}
                bg="gray.50"
                borderRadius="md"
                borderWidth="1px"
                borderColor="gray.200"
                cursor="pointer"
                _hover={{ borderColor: "blue.300", bg: "blue.50" }}
                onClick={() => seekTo(s.start_sec)}
              >
                <HStack justify="space-between" mb={1}>
                  <Badge size="sm" colorPalette="blue" variant="subtle">
                    <Play size={9} /> {fmt(s.start_sec)}–{fmt(s.end_sec)}
                  </Badge>
                </HStack>
                <Text fontSize="xs" color="gray.800">{s.summary}</Text>
                {s.entities?.length > 0 && (
                  <HStack gap={1} mt={1} flexWrap="wrap">
                    {s.entities.filter(Boolean).map((e) => (
                      <Badge key={e} size="xs" style={{ backgroundColor: NODE_COLORS.Entity, color: "white" }}>
                        {e}
                      </Badge>
                    ))}
                  </HStack>
                )}
              </Box>
            ))}
            {!segLoading && segments.length === 0 && (
              <Text fontSize="xs" color="gray.400">No segments.</Text>
            )}
          </VStack>
        </Box>
      </VStack>
    );
  }

  return (
    <Box h="100%" overflow="auto" p={3}>
      <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={2}>
        VIDEOS ({videos.length})
      </Text>
      {videos.length === 0 ? (
        <Flex direction="column" align="center" justify="center" py={10} gap={2} color="gray.400">
          <Film size={28} />
          <Text fontSize="sm" textAlign="center">No videos yet.<br />Run <code>make seed</code> to ingest.</Text>
        </Flex>
      ) : (
        <VStack align="stretch" gap={2}>
          {videos.map((v) => (
            <Box
              key={v.id}
              p={3}
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="md"
              cursor="pointer"
              _hover={{ borderColor: "purple.300", boxShadow: "sm" }}
              onClick={() => openVideo(v)}
            >
              <HStack justify="space-between">
                <Heading size="xs">{v.title}</Heading>
                <Badge size="sm" colorPalette="purple" variant="subtle">{v.segment_count} seg</Badge>
              </HStack>
              {v.summary && (
                <Text fontSize="xs" color="gray.600" mt={1} lineClamp={2}>{v.summary}</Text>
              )}
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );
}
