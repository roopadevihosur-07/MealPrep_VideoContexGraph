"""Application configuration from environment variables.

Thin "Video Agent Context Graph" configuration: self-hosted Neo4j (bolt),
an OpenAI-brained Strands agent, and TwelveLabs (Marengo + Pegasus) for
video understanding. The heavyweight neo4j-agent-memory / NAMS layer from the
generated scaffold has been removed — short-term chat context is kept
in-process (see app.memory).
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from the repo-root .env file."""

    # --- Neo4j (self-hosted, bolt) -----------------------------------------
    neo4j_uri: str = ""
    neo4j_username: str = "neo4j"
    neo4j_password: str = ""
    neo4j_database: str = "neo4j"

    # --- OpenAI (the agent's reasoning brain + entity canonicalization) ----
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"

    # --- TwelveLabs (video understanding) ----------------------------------
    # The SDK auto-reads TWELVE_LABS_API_KEY from the environment; this mirror
    # lets us fail fast with a clear message and pass it explicitly if needed.
    twelve_labs_api_key: str = ""
    # Reuse an existing index by id, or let ingestion create/find one by name.
    tl_index_id: str = ""
    tl_index_name: str = "video-context-graph"
    # Model version strings — config-driven so they can be bumped.
    marengo_model: str = "marengo3.0"          # search/index model on the index
    pegasus_model: str = "pegasus1.2"          # analyze/generate model (index accepts pegasus1.2)
    marengo_embed_model: str = "marengo3.0"  # embed.create model (verified live: 512-dim text embeddings)
    # Neo4j vector index dimension — must match the embed model. The ingest
    # script discovers the true dimension from the first embedding and creates
    # the index accordingly; this is only the default/hint.
    embedding_dimensions: int = 512

    # Public sample clip(s) to ingest when none are supplied. Comma-separated.
    # Big Buck Bunny 720p is the license-clean fallback known to pass TwelveLabs
    # validation; swap in your own clips via SAMPLE_VIDEO_URLS in .env.
    sample_video_urls: str = (
        "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_5MB.mp4"
    )

    # --- App ----------------------------------------------------------------
    domain_id: str = "video-context-graph"
    backend_port: int = 8000
    frontend_port: int = 3000

    model_config = {"env_file": "../.env", "env_file_encoding": "utf-8", "extra": "ignore"}

    @property
    def sample_video_url_list(self) -> list[str]:
        return [u.strip() for u in self.sample_video_urls.split(",") if u.strip()]


settings = Settings()
