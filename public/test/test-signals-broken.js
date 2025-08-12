// 🎛️ TEST SIGNALS GENERATOR - Versão Corrigida
// Gerador de sinais de teste usando Web Audio API

class TestSignalGenerator {
    constructor() {
        this.audioContext = null;
        this.sampleRate = 44100;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        try {
            // Criar AudioContext
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Resume se estiver suspended (política de navegadores)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            this.sampleRate = this.audioContext.sampleRate;
            this.initialized = true;
            
            console.log(`🎛️ Test Signal Generator inicializado (${this.sampleRate}Hz)`);
            return true;
        } catch (error) {
            console.error('❌ Erro ao inicializar gerador de sinais:', error);
            
            // Fallback: usar 44100 sem AudioContext
            this.sampleRate = 44100;
            this.initialized = true;
            console.warn('⚠️ Usando modo fallback sem AudioContext');
            return false;
        }
    }

    // 📊 Gerar seno puro em frequência específica
    async generateSineWave(frequency, duration = 3.0, amplitude = 0.5) {
        await this.initialize();
        
        const length = Math.floor(duration * this.sampleRate);
        let buffer;
        
        if (this.audioContext) {
            buffer = this.audioContext.createBuffer(1, length, this.sampleRate);
        } else {
            // Fallback: criar buffer manual
            buffer = {
                numberOfChannels: 1,
                length: length,
                sampleRate: this.sampleRate,
                getChannelData: function(channel) {
                    if (!this._data) this._data = [new Float32Array(length)];
                    return this._data[channel];
                }
            };
        }
        
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const time = i / this.sampleRate;
            data[i] = amplitude * Math.sin(2 * Math.PI * frequency * time);
        }

        console.log(`🎵 Sinal gerado: ${frequency}Hz, ${duration}s, ${length} samples`);
        return this.bufferToWavFile(buffer, `sine_${frequency}hz`);
    }

    // 🎵 Gerar múltiplos senos (acorde)
    generateMultiSine(frequencies, duration = 3.0, amplitude = 0.3) {
        const length = Math.floor(duration * this.sampleRate);
        const buffer = this.audioContext.createBuffer(1, length, this.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const time = i / this.sampleRate;
            let sample = 0;
            
            frequencies.forEach(freq => {
                sample += amplitude * Math.sin(2 * Math.PI * freq * time);
            });
            
            // Normalizar para evitar clipping
            data[i] = sample / frequencies.length;
        }

        return buffer;
    }

    // 🎲 Gerar ruído branco
    generateWhiteNoise(duration = 3.0, amplitude = 0.2) {
        const length = Math.floor(duration * this.sampleRate);
        const buffer = this.audioContext.createBuffer(1, length, this.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            // Ruído branco usando Math.random() com distribuição uniforme
            data[i] = amplitude * (2 * Math.random() - 1);
        }

        return buffer;
    }

    // 🌈 Gerar ruído rosa (1/f)
    generatePinkNoise(duration = 3.0, amplitude = 0.2) {
        const length = Math.floor(duration * this.sampleRate);
        const buffer = this.audioContext.createBuffer(1, length, this.sampleRate);
        const data = buffer.getChannelData(0);

        // Filtro simples para ruído rosa
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

        for (let i = 0; i < length; i++) {
            const white = Math.random() - 0.5;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            
            const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            data[i] = amplitude * pink * 0.11;
            b6 = white * 0.115926;
        }

        return buffer;
    }

    // 💥 Gerar burst tone (tom com envelope)
    generateBurst(frequency, burstDuration = 0.1, silenceDuration = 0.1, totalDuration = 3.0, amplitude = 0.5) {
        const length = Math.floor(totalDuration * this.sampleRate);
        const buffer = this.audioContext.createBuffer(1, length, this.sampleRate);
        const data = buffer.getChannelData(0);

        const burstSamples = Math.floor(burstDuration * this.sampleRate);
        const silenceSamples = Math.floor(silenceDuration * this.sampleRate);
        const cycleSamples = burstSamples + silenceSamples;

        for (let i = 0; i < length; i++) {
            const cyclePosition = i % cycleSamples;
            
            if (cyclePosition < burstSamples) {
                const time = i / this.sampleRate;
                // Envelope suave para evitar cliques
                const envelope = Math.sin((cyclePosition / burstSamples) * Math.PI);
                data[i] = amplitude * envelope * Math.sin(2 * Math.PI * frequency * time);
            } else {
                data[i] = 0; // Silêncio
            }
        }

        return buffer;
    }

    // 📈 Gerar sweep de frequência
    generateSweep(startFreq, endFreq, duration = 5.0, amplitude = 0.3) {
        const length = Math.floor(duration * this.sampleRate);
        const buffer = this.audioContext.createBuffer(1, length, this.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const time = i / this.sampleRate;
            const progress = time / duration;
            
            // Sweep logarítmico
            const freq = startFreq * Math.pow(endFreq / startFreq, progress);
            data[i] = amplitude * Math.sin(2 * Math.PI * freq * time);
        }

        return buffer;
    }

    // 🎭 Gerar sinal com problemas específicos (para testes)
    async generateProblematicSignal(problemType, duration = 3.0) {
        await this.initialize();
        
        const length = Math.floor(duration * this.sampleRate);
        let buffer;
        
        if (this.audioContext) {
            buffer = this.audioContext.createBuffer(2, length, this.sampleRate);
        } else {
            // Fallback: criar buffer manual estéreo
            buffer = {
                numberOfChannels: 2,
                length: length,
                sampleRate: this.sampleRate,
                getChannelData: function(channel) {
                    if (!this._data) this._data = [new Float32Array(length), new Float32Array(length)];
                    return this._data[channel];
                }
            };
        }
        
        const leftData = buffer.getChannelData(0);
        const rightData = buffer.getChannelData(1);

        switch (problemType) {
            case 'clipping':
                // Sinal que clipa intencionalmente
                for (let i = 0; i < length; i++) {
                    const time = i / this.sampleRate;
                    const signal = 1.5 * Math.sin(2 * Math.PI * 440 * time); // Amplitude > 1
                    leftData[i] = Math.max(-1, Math.min(1, signal));
                    rightData[i] = Math.max(-1, Math.min(1, signal));
                }
                console.log('🚨 Sinal com clipping gerado');
                break;

            case 'dc_offset':
                // Sinal com DC offset
                for (let i = 0; i < length; i++) {
                    const time = i / this.sampleRate;
                    const signal = 0.5 * Math.sin(2 * Math.PI * 440 * time);
                    leftData[i] = signal + 0.3; // DC offset positivo
                    rightData[i] = signal + 0.3;
                }
                console.log('⚡ Sinal com DC offset gerado');
                break;

            case 'phase_issues':
                // Canal direito invertido (problema de fase)
                for (let i = 0; i < length; i++) {
                    const time = i / this.sampleRate;
                    const signal = 0.5 * Math.sin(2 * Math.PI * 440 * time);
                    leftData[i] = signal;
                    rightData[i] = -signal; // Invertido
                }
                console.log('🔄 Sinal com problemas de fase gerado');
                break;

            default:
                // Sinal padrão com múltiplas frequências
                for (let i = 0; i < length; i++) {
                    const time = i / this.sampleRate;
                    let signal = 0;
                    signal += 0.3 * Math.sin(2 * Math.PI * 130 * time); // Trance-like
                    signal += 0.2 * Math.sin(2 * Math.PI * 260 * time);
                    signal += 0.1 * Math.sin(2 * Math.PI * 520 * time);
                    leftData[i] = signal;
                    rightData[i] = signal;
                }
                console.log('🎵 Sinal multi-frequência gerado');
        }

    // 🔄 Converter AudioBuffer para arquivo
    bufferToWavFile(buffer, filename) {
        const wavBlob = this.audioBufferToWAV(buffer);
        return new File([wavBlob], filename + '.wav', { type: 'audio/wav' });
    }
    }

    // 🎼 Gerar sinal complexo realístico (simula música)
    generateRealisticSignal(type = 'electronic', duration = 5.0) {
        const length = Math.floor(duration * this.sampleRate);
        const buffer = this.audioContext.createBuffer(2, length, this.sampleRate);
        const leftData = buffer.getChannelData(0);
        const rightData = buffer.getChannelData(1);

        for (let i = 0; i < length; i++) {
            const time = i / this.sampleRate;
            let leftSignal = 0;
            let rightSignal = 0;

            switch (type) {
                case 'electronic':
                    // Simular música eletrônica
                    leftSignal += 0.3 * Math.sin(2 * Math.PI * 60 * time); // Kick fundamental
                    leftSignal += 0.2 * Math.sin(2 * Math.PI * 120 * time); // Harmônico
                    leftSignal += 0.15 * Math.sin(2 * Math.PI * 440 * time); // Lead synth
                    leftSignal += 0.1 * Math.sin(2 * Math.PI * 880 * time); // Harmonics
                    leftSignal += 0.08 * Math.sin(2 * Math.PI * 2000 * time); // Hi-freq content
                    leftSignal += 0.05 * (Math.random() - 0.5); // Noise/texture
                    
                    rightSignal = leftSignal * 0.95; // Slight stereo difference
                    rightSignal += 0.03 * Math.sin(2 * Math.PI * 1200 * time * 1.01); // Stereo width
                    break;

                case 'trance':
                    // Simular trance
                    leftSignal += 0.4 * Math.sin(2 * Math.PI * 50 * time); // Sub bass
                    leftSignal += 0.3 * Math.sin(2 * Math.PI * 80 * time); // Kick
                    leftSignal += 0.2 * Math.sin(2 * Math.PI * 220 * time); // Acid bass
                    leftSignal += 0.15 * Math.sin(2 * Math.PI * 660 * time); // Lead
                    leftSignal += 0.1 * Math.sin(2 * Math.PI * 4000 * time); // Bright harmonics
                    
                    rightSignal = leftSignal * 0.98;
                    rightSignal += 0.05 * Math.sin(2 * Math.PI * 880 * time * 1.02); // Stereo lead
                    break;

                case 'funk':
                    // Simular funk
                    leftSignal += 0.35 * Math.sin(2 * Math.PI * 70 * time); // Kick punch
                    leftSignal += 0.25 * Math.sin(2 * Math.PI * 150 * time); // Body
                    leftSignal += 0.2 * Math.sin(2 * Math.PI * 300 * time); // Midrange
                    leftSignal += 0.15 * Math.sin(2 * Math.PI * 800 * time); // Presence
                    leftSignal += 0.1 * Math.sin(2 * Math.PI * 3000 * time); // Snap
                    
                    rightSignal = leftSignal;
                    break;

                default:
                    // Sinal neutro
                    leftSignal = 0.5 * Math.sin(2 * Math.PI * 440 * time);
                    rightSignal = leftSignal;
            }

            leftData[i] = Math.max(-0.95, Math.min(0.95, leftSignal));
            rightData[i] = Math.max(-0.95, Math.min(0.95, rightSignal));
        }

        return buffer;
    }

    // 🔄 Converter AudioBuffer para Blob WAV
    audioBufferToWAV(audioBuffer) {
        const numChannels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;
        const length = audioBuffer.length;
        const arrayBuffer = new ArrayBuffer(44 + length * numChannels * 2);
        const view = new DataView(arrayBuffer);

        // WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * numChannels * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numChannels * 2, true);
        view.setUint16(32, numChannels * 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length * numChannels * 2, true);

        // Audio data
        let offset = 44;
        for (let i = 0; i < length; i++) {
            for (let channel = 0; channel < numChannels; channel++) {
                const sample = audioBuffer.getChannelData(channel)[i];
                const int16Sample = Math.max(-1, Math.min(1, sample)) * 0x7FFF;
                view.setInt16(offset, int16Sample, true);
                offset += 2;
            }
        }

        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }

    // 📦 Gerar conjunto completo de sinais de teste
    async generateTestSuite() {
        await this.initialize();
        
        const testSignals = {
            // Sinais básicos
            'sine_50hz': this.generateSineWave(50, 3.0, 0.5),
            'sine_440hz': this.generateSineWave(440, 3.0, 0.5),
            'sine_1khz': this.generateSineWave(1000, 3.0, 0.5),
            'sine_8khz': this.generateSineWave(8000, 3.0, 0.3),
            
            // Sinais compostos
            'multi_tone': this.generateMultiSine([220, 440, 880, 1760], 3.0, 0.3),
            'white_noise': this.generateWhiteNoise(3.0, 0.2),
            'pink_noise': this.generatePinkNoise(3.0, 0.2),
            
            // Sinais de teste específicos
            'burst_1khz': this.generateBurst(1000, 0.1, 0.1, 3.0, 0.5),
            'sweep_20_20k': this.generateSweep(20, 20000, 5.0, 0.3),
            
            // Sinais problemáticos
            'clipping_test': this.generateProblematicSignal('clipping', 3.0),
            'dc_offset_test': this.generateProblematicSignal('dc_offset', 3.0),
            'phase_test': this.generateProblematicSignal('phase_invert', 3.0),
            'imbalance_test': this.generateProblematicSignal('imbalanced', 3.0),
            'mud_test': this.generateProblematicSignal('mud', 3.0),
            'harsh_test': this.generateProblematicSignal('harsh', 3.0),
            
            // Sinais realísticos
            'electronic_music': this.generateRealisticSignal('electronic', 5.0),
            'trance_music': this.generateRealisticSignal('trance', 5.0),
            'funk_music': this.generateRealisticSignal('funk', 5.0)
        };

        console.log(`🎛️ Suite de ${Object.keys(testSignals).length} sinais de teste gerada`);
        return testSignals;
    }

    // 🎯 Criar File object a partir de AudioBuffer
    createTestFile(audioBuffer, filename) {
        const wavBlob = this.audioBufferToWAV(audioBuffer);
        return new File([wavBlob], filename + '.wav', { type: 'audio/wav' });
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.TestSignalGenerator = TestSignalGenerator;
}

console.log('🎛️ Test Signals Generator carregado');
