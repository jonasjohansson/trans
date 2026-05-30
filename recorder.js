// Video codec selection for matte's MP4 recorder. Pure WebCodecs probing —
// no app state/GPU. Imported by main.js's startRecording().

export function codecMaxDim(codecString) {
  if (codecString.includes('L153')) return 8192;   // HEVC L5.1
  if (codecString.includes('L120')) return 4096;   // HEVC L4 or AVC L4
  if (codecString.includes('L033')) return 8192;   // (informational)
  if (codecString.includes('640033')) return 8192; // AVC High L5.1
  if (codecString.includes('640028')) return 4096; // AVC High L4
  return 3840;
}

export // Try a series of VideoEncoder configs in descending order of profile/level so
// we pick the highest-headroom one this machine actually supports.
async function pickEncoderConfig(width, height, framerate, bitrate) {
  if (typeof VideoEncoder === 'undefined') return null;
  const candidates = [
    { codec: 'hev1.1.6.L153.B0', muxer: 'hevc' }, // HEVC Main L5.1 — 8K
    { codec: 'hev1.1.6.L120.B0', muxer: 'hevc' }, // HEVC Main L4   — 4K
    { codec: 'avc1.640033',      muxer: 'avc'  }, // H.264 High L5.1
    { codec: 'avc1.640028',      muxer: 'avc'  }, // H.264 High L4
    { codec: 'avc1.42E01E',      muxer: 'avc'  }, // H.264 Baseline L3
  ];
  for (const c of candidates) {
    try {
      const cfg = {
        codec: c.codec, width, height, framerate, bitrate,
        hardwareAcceleration: 'prefer-hardware',
      };
      const r = await VideoEncoder.isConfigSupported(cfg);
      if (r && r.supported) return { config: cfg, muxerCodec: c.muxer };
    } catch {}
  }
  return null;
}
