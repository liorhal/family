/** Play a random short happy success sound using Web Audio API */
export function playSuccessSound() {
  if (typeof window === "undefined") return;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: new () => AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const sounds: { notes: number[]; type?: OscillatorType; step?: number }[] = [
      { notes: [523.25, 659.25, 783.99, 1046.5] }, // C5 E5 G5 C6 - ascending
      { notes: [392, 523.25, 659.25, 783.99], step: 0.1 }, // G4 C5 E5 G5
      { notes: [659.25, 783.99, 1046.5, 1318.5] }, // E5 G5 C6 E6 - brighter
      { notes: [523.25, 659.25, 523.25, 783.99], step: 0.09 }, // C5 E5 C5 G5 - bouncy
      { notes: [440, 554.37, 659.25, 880], type: "triangle" }, // A4 C#5 E5 A5
    ];
    const sound = sounds[Math.floor(Math.random() * sounds.length)];
    const step = sound.step ?? 0.08;
    const oscType = (sound.type ?? "sine") as OscillatorType;
    sound.notes.forEach((freq, i) => {
      const start = ctx.currentTime + i * step;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = oscType;
      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  } catch {
    // Ignore audio errors (e.g. autoplay blocked)
  }
}
