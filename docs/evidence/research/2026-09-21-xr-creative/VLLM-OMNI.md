# vLLM-Omni: candidate inference backend for Foundry

Decision, 2026-09-21: **evaluate it as an optional GPU inference service behind Asset Foundry**. It is relevant for owned generation infrastructure and selected runtime AI services. It does not replace the Foundry job/asset ledger, Blender, the game engine, or Quest's render loop. No GPU deployment or model generation was performed in this research.

## What was inspected

- [Repository](https://github.com/vllm-project/vllm-omni), Apache-2.0 metadata, active default branch at [`5e28163ba5b329f5bed36272aca2f9f65e53ef88`](https://github.com/vllm-project/vllm-omni/tree/5e28163ba5b329f5bed36272aca2f9f65e53ef88).
- Latest published release returned by GitHub: [v0.28.0](https://github.com/vllm-project/vllm-omni/releases/tag/v0.28.0), published August 31, 2026, resolved to [`eb11446b7f2e30ca582f8aff3afe12e9a2e66f6c`](https://github.com/vllm-project/vllm-omni/tree/eb11446b7f2e30ca582f8aff3afe12e9a2e66f6c).
- Selected installation, model, serving, memory, metrics, fault-handling and storage sources; [fetch receipts](omni-source-evidence.json). Both release and development snapshots were sampled. The serving index moved between them, which itself demonstrates why a `latest` URL is not a release contract.

## Suitable workloads

| Workload | Potential use in our system | Boundary |
|---|---|---|
| Images and image edits | Concept candidates, backgrounds, texture-source images, marketing sources | A generated picture is not an editable vector, PBR set or 3D mesh unless a separate pipeline produces those artifacts |
| Speech, music and sound | Narration, approved NPC lines, ambience/SFX candidates, localization | Voice/model rights, pronunciation, output format, duration and audio QA remain required |
| Video | Short shot candidates, image-to-video, product/trailer sources | HyperFrames still owns exact composition, captions/timing and verified final render |
| Multimodal understanding | Selected visual/audio interpretation or content tagging | Supported inputs/outputs are model-specific; visual plausibility does not prove geometry or safe navigation |
| Streaming dialogue | Experimental remote NPC/assistant service | Network latency, interruption, offline behavior and user data need their own application contract |
| World/action models | Research/simulation candidates where a matching task exists | Generated video/action arrays do not establish a playable, collision-consistent, synchronized VR world |

The [release model table](https://github.com/vllm-project/vllm-omni/blob/eb11446b7f2e30ca582f8aff3afe12e9a2e66f6c/docs/models/supported_models.md) lists candidates such as Z-Image, Qwen-Image/Edit, Wan, LTX, Qwen3-TTS and CosyVoice. Select one exact checkpoint/revision/license per experiment. Hardware checkmarks differ by model/backend, and the development table distinguishes recipe-audited rows from implementation metadata. A listed architecture is not a benchmark on our hardware or proof of commercial rights.

## Deployment and API contract

The current [installation guide](https://docs.vllm.ai/projects/vllm-omni/en/latest/getting_started/installation/) distinguishes the 0.29 development line requiring vLLM 0.29.x from published 0.28 artifacts requiring vLLM 0.28.x. Pin the Omni/vLLM pair, Python, PyTorch/backend, drivers, container digest, model revision and deploy configuration. Do not combine a stable wheel with commands copied from current main. The [quickstart](https://docs.vllm.ai/projects/vllm-omni/en/latest/getting_started/quickstart/) documents Linux/Python 3.12; this is not a documented Quest/Android or macOS-native inference recipe.

Evaluate a separate compatible accelerator host. Backend support is platform- and model-specific; a general NVIDIA compute-capability floor does not prove every selected kernel/model works. The CUDA guide's two-H100 example is one model recipe, not a universal minimum or a buying recommendation. No hardware purchase is justified before a workload measurement.

The [development serving index](https://github.com/vllm-project/vllm-omni/blob/5e28163ba5b329f5bed36272aca2f9f65e53ef88/docs/serving/README.md) describes one loaded model per server instance and task-dependent endpoints:

| Task | Inspected HTTP surface | Adapter implication |
|---|---|---|
| Discovery | `/health`, `/v1/models` | Check process readiness and loaded identity, then perform a task-specific fixture; health alone is insufficient |
| Image generation/edit | `/v1/images/generations`, `/v1/images/edits` | JSON versus multipart and supported output form must match the selected model |
| Speech / other audio | `/v1/audio/speech`, `/v1/audio/generate` | Persist/decode returned media; do not treat all audio models as interchangeable TTS |
| Video | `/v1/videos`, status/content/delete routes | Persist remote job ID; poll and retrieve final artifact; blocking `/sync` is a different path |
| Conversation | `/v1/chat/completions` | Message/modalities schema and output chunks vary with the pipeline |
| Realtime | Several distinct WebSocket routes | Negotiate the exact protocol/capabilities; streaming TTS, video input, generated video and duplex dialogue are different wires |

These are development-snapshot capabilities, not a promise that every route exists in v0.28.0 or for every model. Verify the selected release's schemas. OpenAI compatibility is partial/task-specific; it does not make this an MCP server or a drop-in replacement for every hosted provider. For current duplex details see the [version-pinned protocol](https://github.com/vllm-project/vllm-omni/blob/5e28163ba5b329f5bed36272aca2f9f65e53ef88/docs/serving/realtime_duplex_api.md).

## What Foundry must continue to own

1. **Durable intent:** project, target, rights, input hashes, requested capability, model/deploy revision, budget/compute cap and stable order ID before submission.
2. **Execution state:** submit/start/remote ID, bounded retries, timeout/cancellation, terminal result, uncertain outcome and reconciliation. Do not resubmit an unknown in-flight job blindly after restart.
3. **Artifact lifetime:** durable outputs, content hash, lineage, transformations, QA and consumer import/playback. Do not rely only on a temporary URL or provider local file.
4. **Cost:** GPU reservation and actual usage, idle allocation, storage/egress and accepted outputs. Open-source code does not make GPU time free.
5. **Access:** authenticated service-to-service calls, tenant/project separation, bounded payloads and queues, model allowlist, approved input origins, retention and log redaction.

The [inspected video stores](https://github.com/vllm-project/vllm-omni/blob/5e28163ba5b329f5bed36272aca2f9f65e53ef88/vllm_omni/entrypoints/openai/stores.py) use an in-memory dictionary and task registry. The [storage manager](https://github.com/vllm-project/vllm-omni/blob/5e28163ba5b329f5bed36272aca2f9f65e53ef88/vllm_omni/entrypoints/openai/storage.py) separately manages output files/TTL. Therefore neither an async API response nor a persistent output volume alone proves durable job recovery. Test restart/reconciliation and do not advertise it as implemented by our adapter yet.

The [video API](https://github.com/vllm-project/vllm-omni/blob/5e28163ba5b329f5bed36272aca2f9f65e53ef88/docs/serving/videos_api.md) describes bounded best-effort abort; an admitted batch may still drain. Deletion/cancel does not prove instant compute reclamation. [Fault-injection documentation](https://github.com/vllm-project/vllm-omni/blob/5e28163ba5b329f5bed36272aca2f9f65e53ef88/docs/user_guide/fault_injection_reliability_matrix.md) distinguishes frontend, orchestrator, worker and GPU failures. Use it to select tests rather than infer a universal production guarantee.

## Performance and economics experiment

Start with one approved speech model or image model, not an all-modality cluster. Freeze a small representative fixture set and the quality rubric. Measure cold start, warm latency distributions, time to first usable audio/frame, total duration, throughput at controlled concurrency, peak VRAM/RAM, OOM/error rate, cancellation cleanup and restart behavior. Include input/output dimensions, clip length, batch size and precision/cache settings.

The [memory guide](https://github.com/vllm-project/vllm-omni/blob/5e28163ba5b329f5bed36272aca2f9f65e53ef88/docs/configuration/gpu_memory_utilization.md) describes per-stage allocation; do not reuse its small speech-stage fractions as universal budgets for video diffusion. Include weights, KV/activation memory, VAE/output decoding, backend workspaces and concurrent requests. Shared GPU stages need a coordinated allocation and headroom.

Evaluate batching, parallel execution, quantization, offload and caching separately. They can trade latency/quality for memory/throughput; do not inherit an upstream speedup claim without matching model, hardware and workload. Use [production metrics](https://github.com/vllm-project/vllm-omni/blob/5e28163ba5b329f5bed36272aca2f9f65e53ef88/docs/usage/metrics.md) plus Foundry's job outcomes, not a single tokens-per-second number for every media type.

Compute cost per **accepted** artifact as allocated GPU cost plus storage/egress/operating cost divided by accepted outputs. Include idle capacity and rejected generations. Compare the same brief against an existing hosted provider and a simple baseline. A self-hosted option becomes worthwhile only if measured quality, throughput, privacy/control or predictable utilization justifies its operational cost.

## Related tools worth evaluating

| Tool | Relationship | Recommended use |
|---|---|---|
| [Built-in ComfyUI integration](https://docs.vllm.ai/projects/vllm-omni/en/stable/features/comfyui/) | Nodes call local/remote Omni inference APIs | Reuse for reviewed artist workflows; it cannot expose capabilities absent from the API. Separate environments and pin node/workflow versions |
| [Hugging Face Diffusers](https://huggingface.co/docs/diffusers/quicktour) | Model/pipeline library and baseline inference | Use for a small explicit worker or baseline; compare [memory/offload tradeoffs](https://huggingface.co/docs/diffusers/optimization/memory), not just throughput |
| [SGLang Diffusion](https://github.com/sgl-project/sglang/blob/main/docs/docs/sglang-diffusion/index.mdx) | Alternative image/video serving engine | Benchmark a common model/workload if diffusion throughput is the bottleneck; no basis here to declare a winner or deploy two stacks |
| [Unity Inference Engine on Quest](https://developers.meta.com/horizon/documentation/unity/unity-pca-sentis/) | Small on-device ML/CV lane | Consider for camera/interaction tasks that need local processing; measure supported operators and contention with rendering |
| Existing hosted providers | Managed generation capacity | Retain as alternatives/fallbacks where account, budget and input rights permit; do not silently switch a private/local brief to cloud |

## Runtime VR/MR use

Offline asset production is the first integration. For later NPC speech or visual assistance, separate camera/microphone acquisition, application logic, remote inference and playback. Use short-lived session IDs, bounded backpressure, turn interruption, timeout, cached responses and disconnected operation. Keep network/model work off render/physics deadlines and essential interaction paths.

Raw room images and microphone data require the actual product permission/consent/data contract; passthrough rendering does not authorize an upload. World-model video is not spatial truth for collision or safe movement. Re-test on real hardware with user movement, audio echo, packet delay/loss, input changes and background/resume.

## Integration decision and packet

Add **P16: optional self-hosted multimodal backend** to the existing plan, dependent on P08/P09 portability/readiness and shared brief/manifest contracts. Implement one Foundry provider adapter against pinned task schemas, a worker deployment reference, synthetic contract tests and a separately budgeted GPU benchmark. Keep existing transports available; no direct provider bypass from a Foundry-managed consumer.

Acceptance: wrong model/task rejected; authentication checked; duplicate/uncertain submissions reconciled; cancellation/restart/OOM handled; output decoded and manifested; compute cap enforced; no media/secret leakage in logs; quality/cost comparison recorded. GPU absence yields NOT-RUN, not an invented successful install. This research does not create that adapter.

The family should expose this as a Foundry capability/reference first. A separate portable `multimodal-serving` skill in the infrastructure/agent family is justified only after the deployment and operating contract has been exercised. Do not add one mandatory skill per vendor or install GPU services with the default family bundle.
