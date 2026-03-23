// ========== CONFIGURATION ==========
const SEGMENTS = [
    { label: '10%', value: 10, color: '#1e40af', lightColor: '#3b82f6', probability: 0.60, message: '¡Obtuviste un bono del 10%! Cada ficha extra cuenta. 🎰' },
    { label: '20%', value: 20, color: '#7c3aed', lightColor: '#a855f7', probability: 0.30, message: '¡Increíble! Un bono del 20%. ¡Estás en racha! 🔥' },
    { label: '30%', value: 30, color: '#b45309', lightColor: '#f5c518', probability: 0.10, message: '¡JACKPOT! ¡El bono ÉPICO del 30%! ¡Eres muy afortunado! 🏆💰' },
];

// Roulette visual segments (repeated to fill the wheel)
const VISUAL_SEGMENTS = [
    SEGMENTS[0], SEGMENTS[1], SEGMENTS[0], SEGMENTS[2],
    SEGMENTS[0], SEGMENTS[1], SEGMENTS[0], SEGMENTS[1],
    SEGMENTS[0], SEGMENTS[2], SEGMENTS[0], SEGMENTS[1],
];

const STORAGE_KEY = 'casinoBonusResults';
let isSpinning = false;
let currentRotation = 0;

// ========== INITIALIZE ==========
document.addEventListener('DOMContentLoaded', () => {
    drawWheel();
    createParticles();
    
    // Enter key to spin
    document.getElementById('usernameInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') spinRoulette();
    });
});

// ========== DRAW ROULETTE WHEEL ==========
function drawWheel() {
    const canvas = document.getElementById('rouletteCanvas');
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2 - 10;
    const segCount = VISUAL_SEGMENTS.length;
    const arc = (2 * Math.PI) / segCount;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw outer ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 5, 0, 2 * Math.PI);
    ctx.strokeStyle = '#f5c518';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.closePath();

    // Draw segments
    for (let i = 0; i < segCount; i++) {
        const startAngle = i * arc;
        const endAngle = startAngle + arc;
        const seg = VISUAL_SEGMENTS[i];

        // Gradient for segment
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, seg.lightColor + '40');
        gradient.addColorStop(0.4, seg.color);
        gradient.addColorStop(1, seg.color + 'dd');

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Segment border
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Text
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + arc / 2);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px "Outfit", sans-serif';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.fillText(seg.label, radius * 0.65, 0);
        ctx.restore();
    }

    // Center circle
    const centerGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 40);
    centerGrad.addColorStop(0, '#f5c518');
    centerGrad.addColorStop(0.7, '#c9a100');
    centerGrad.addColorStop(1, '#8b6914');

    ctx.beginPath();
    ctx.arc(centerX, centerY, 35, 0, 2 * Math.PI);
    ctx.fillStyle = centerGrad;
    ctx.fill();
    ctx.strokeStyle = '#ffe066';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.closePath();

    // Center text
    ctx.fillStyle = '#0a0e17';
    ctx.font = 'bold 14px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BONUS', centerX, centerY);
}

// ========== WEIGHTED RANDOM ==========
function getWeightedResult() {
    const rand = Math.random();
    let cumulative = 0;
    
    for (const seg of SEGMENTS) {
        cumulative += seg.probability;
        if (rand <= cumulative) {
            return seg;
        }
    }
    
    return SEGMENTS[0]; // fallback
}

// ========== FIND SEGMENT INDEX ==========
function findSegmentIndex(result) {
    // Find all indices of this result in visual segments
    const indices = [];
    for (let i = 0; i < VISUAL_SEGMENTS.length; i++) {
        if (VISUAL_SEGMENTS[i].value === result.value) {
            indices.push(i);
        }
    }
    // Pick a random one of the matching indices
    return indices[Math.floor(Math.random() * indices.length)];
}

// ========== SPIN ROULETTE ==========
function spinRoulette() {
    if (isSpinning) return;

    const usernameInput = document.getElementById('usernameInput');
    const errorEl = document.getElementById('inputError');
    const username = usernameInput.value.trim();

    // Validate
    if (!username) {
        errorEl.textContent = '⚠️ Ingresa tu nombre de usuario para girar';
        usernameInput.focus();
        shakeElement(document.querySelector('.input-wrapper'));
        return;
    }

    errorEl.textContent = '';
    isSpinning = true;

    const spinBtn = document.getElementById('spinBtn');
    spinBtn.disabled = true;
    spinBtn.querySelector('.spin-btn-text').textContent = 'GIRANDO...';

    const canvas = document.getElementById('rouletteCanvas');
    canvas.classList.add('spinning');

    // Get weighted result
    const result = getWeightedResult();
    const segIndex = findSegmentIndex(result);
    const segCount = VISUAL_SEGMENTS.length;
    const segAngle = 360 / segCount;

    // Calculate target angle: the pointer is at the top (270°/12 o'clock)
    // We need the center of the winning segment to align with 270° (top)
    const segCenterAngle = segIndex * segAngle + segAngle / 2;
    // Target rotation so that segment center is at top (pointer at 0° = top of circle)
    const targetOffset = 360 - segCenterAngle;
    
    // Add multiple full spins + offset + randomness within segment
    const fullSpins = 5 + Math.floor(Math.random() * 3); // 5-7 full spins
    const randomWithinSeg = (Math.random() - 0.5) * (segAngle * 0.6); // Random within ~60% of segment
    const totalRotation = fullSpins * 360 + targetOffset + randomWithinSeg;

    // Apply CSS transform animation
    currentRotation += totalRotation;
    canvas.style.transition = 'transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
    canvas.style.transform = `rotate(${currentRotation}deg)`;

    // After spin finishes
    setTimeout(() => {
        isSpinning = false;
        canvas.classList.remove('spinning');
        spinBtn.disabled = false;
        spinBtn.querySelector('.spin-btn-text').textContent = '¡GIRAR!';

        // Save result
        saveResult(username, result);

        // Show modal
        showResultModal(username, result);
    }, 5300);
}

// ========== SAVE RESULT ==========
function saveResult(username, result) {
    const results = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    results.push({
        username: username,
        bonus: result.value,
        label: result.label,
        date: new Date().toLocaleString('es-AR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }),
        timestamp: Date.now()
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
}

// ========== SHOW RESULT MODAL ==========
function showResultModal(username, result) {
    const modal = document.getElementById('resultModal');
    
    document.getElementById('modalUsername').textContent = `Jugador: ${username}`;
    document.getElementById('prizePercent').textContent = result.label;
    document.getElementById('modalMessage').textContent = result.message;

    // Generate confetti
    createConfetti();

    // Show with animation
    modal.style.display = 'flex';
    requestAnimationFrame(() => {
        modal.classList.add('active');
    });

    // Clear username
    document.getElementById('usernameInput').value = '';
}

// ========== CLOSE MODAL ==========
function closeModal() {
    const modal = document.getElementById('resultModal');
    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
        document.getElementById('confettiContainer').innerHTML = '';
    }, 400);
}

// ========== CONFETTI ==========
function createConfetti() {
    const container = document.getElementById('confettiContainer');
    container.innerHTML = '';
    const colors = ['#f5c518', '#ffe066', '#a855f7', '#3b82f6', '#ef4444', '#22c55e', '#ec4899', '#06b6d4'];

    for (let i = 0; i < 60; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + '%';
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDelay = Math.random() * 2 + 's';
        piece.style.animationDuration = (2 + Math.random() * 2) + 's';
        piece.style.width = (5 + Math.random() * 10) + 'px';
        piece.style.height = (5 + Math.random() * 10) + 'px';
        piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        piece.style.transform = `rotate(${Math.random() * 360}deg)`;
        container.appendChild(piece);
    }
}

// ========== SHAKE ANIMATION ==========
function shakeElement(el) {
    el.style.animation = 'none';
    el.offsetHeight; // trigger reflow
    el.style.animation = 'shake 0.5s ease';
    
    // Add shake keyframes if not already
    if (!document.getElementById('shakeStyle')) {
        const style = document.createElement('style');
        style.id = 'shakeStyle';
        style.textContent = `
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                20%, 40%, 60%, 80% { transform: translateX(5px); }
            }
        `;
        document.head.appendChild(style);
    }
}

// ========== BACKGROUND PARTICLES ==========
function createParticles() {
    const container = document.getElementById('particles');
    
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 6 + 's';
        particle.style.animationDuration = (4 + Math.random() * 4) + 's';
        
        const colors = ['#f5c518', '#a855f7', '#3b82f6', '#ffffff'];
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        particle.style.width = (2 + Math.random() * 4) + 'px';
        particle.style.height = particle.style.width;
        
        container.appendChild(particle);
    }
}
