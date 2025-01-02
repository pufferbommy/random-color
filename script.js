// Constants
const STORAGE_KEYS = {
    IS_MUTED: 'isMuted'
}

const MESSAGES = {
    DEFAULT: 'Click anywhere to copy color.',
    RANDOM_COLOR: 'Click to random new color.',
    SOURCE_CODE: 'Go to source code.',
    MUTE: 'Click to mute.',
    UNMUTE: 'Click to unmute.'
}

// Initialize app
init()

async function init() {
    // Get DOM elements
    const elements = {
        randomButton: document.getElementById('random-button'),
        followMouseText: document.getElementById('follow-mouse-text'), 
        volumeButton: document.getElementById('volumn-button'),
        repoLink: document.getElementById('repo-link')
    }

    const gap = 32
    let mouseX, mouseY
    
    // Load saved settings
    loadSettings()
    let isMuted = JSON.parse(elements.volumeButton.dataset.muted)

    // Set up initial color
    const colors = await getColors()
    let currentColor = getRandomColor(colors)
    updateDisplay(currentColor)

    // Event handlers
    function handleRandomButtonClick(event) {
        event.stopPropagation()
        currentColor = getRandomColor(colors)
        updateDisplay(currentColor)
        playSound(isMuted)
    }

    function handleRepoLinkClick(event) {
        event.stopPropagation()
        playSound(isMuted)
    }

    function handleVolumeButtonClick(event) {
        event.stopPropagation()
        isMuted = !isMuted
        elements.volumeButton.dataset.muted = JSON.stringify(isMuted)
        localStorage.setItem(STORAGE_KEYS.IS_MUTED, JSON.stringify(isMuted))
        elements.followMouseText.innerText = isMuted ? MESSAGES.UNMUTE : MESSAGES.MUTE
        playSound(isMuted)
    }

    function handleBodyClick() {
        navigator.clipboard.writeText(currentColor.hex)
        showAlert(mouseX, mouseY, gap)
        playSound(isMuted)
    }

    function handleMouseMove(event) {
        mouseX = event.clientX
        mouseY = event.clientY
        updateFollowMouseText(mouseX, mouseY, gap)
    }

    // Add event listeners
    elements.randomButton.addEventListener('click', handleRandomButtonClick)
    elements.randomButton.addEventListener('mouseenter', () => {
        elements.followMouseText.innerText = MESSAGES.RANDOM_COLOR
    })
    elements.randomButton.addEventListener('mouseleave', () => {
        elements.followMouseText.innerText = MESSAGES.DEFAULT
    })

    elements.repoLink.addEventListener('click', handleRepoLinkClick)
    elements.repoLink.addEventListener('mouseenter', () => {
        elements.followMouseText.innerText = MESSAGES.SOURCE_CODE
    })
    elements.repoLink.addEventListener('mouseleave', () => {
        elements.followMouseText.innerText = MESSAGES.DEFAULT
    })

    elements.volumeButton.addEventListener('click', handleVolumeButtonClick)
    elements.volumeButton.addEventListener('mouseenter', () => {
        elements.followMouseText.innerText = isMuted ? MESSAGES.UNMUTE : MESSAGES.MUTE
    })
    elements.volumeButton.addEventListener('mouseleave', () => {
        elements.followMouseText.innerText = MESSAGES.DEFAULT
    })

    document.body.addEventListener('click', handleBodyClick)
    document.body.addEventListener('mousemove', handleMouseMove)
}

async function getColors() {
    const response = await fetch('https://raw.githubusercontent.com/jonathantneal/color-names/refs/heads/master/color-names.json')
    return await response.json()
}

function getRandomColor(colors) {
    const colorKeys = Object.keys(colors)
    const randomColorKey = colorKeys[randomNumber(0, colorKeys.length - 1)]
    return {
        name: colors[randomColorKey],
        hex: randomColorKey
    }
}

function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function getLightness(r, g, b) {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b // per ITU-R BT.709
}

function isDarkBackground(r, g, b) {
    return getLightness(r, g, b) < 90
}

function hexToRgb(hex) {
    return hex.match(/[A-Za-z0-9]{2}/g).map(v => parseInt(v, 16))
}

function updateDisplay(color) {
    const isDark = isDarkBackground(...hexToRgb(color.hex))
    const textColor = isDark ? 'white' : 'black'

    document.getElementById('color-name').textContent = color.name
    document.getElementById('color-hex').textContent = color.hex
    document.body.style.backgroundColor = color.hex
    document.body.style.color = textColor
    document.title = `${color.name} - ${color.hex}`
    document.querySelector('#repo-link img').style.filter = isDark ? 'invert(1)' : 'invert(0)'
    
    // Generate and update favicon
    const favicon = document.querySelector('link[rel="icon"]') || document.createElement('link')
    favicon.type = 'image/x-icon'
    favicon.rel = 'icon'
    
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = color.hex
    ctx.arc(16, 16, 16, 0, 2 * Math.PI)
    ctx.fill()
    
    favicon.href = canvas.toDataURL()
    if (!document.querySelector('link[rel="icon"]')) {
        document.head.appendChild(favicon)
    }
}

function showAlert(mouseX, mouseY, gap) {
    const alertEl = document.createElement('div')
    const hexColor = document.getElementById('color-hex').textContent

    alertEl.classList.add('alert')
    alertEl.innerHTML = `Copy color <span style="background-color: ${hexColor}; color: ${document.body.style.color}">${hexColor}</span> to clipboard successfully!`
    alertEl.style.animation = 'float 3s forwards'

    document.body.appendChild(alertEl)

    const isFlippedX = mouseX + alertEl.clientWidth + gap > window.innerWidth
    const isFlippedY = mouseY - alertEl.clientHeight - gap <= 0

    alertEl.style.left = isFlippedX ? `${mouseX - alertEl.clientWidth - gap}px` : `${mouseX + gap}px`
    alertEl.style.top = isFlippedY ? `${mouseY + alertEl.clientHeight}px` : `${mouseY - alertEl.clientHeight}px`

    alertEl.addEventListener('animationend', () => alertEl.remove())
}

function updateFollowMouseText(mouseX, mouseY, gap) {
    const followMouseTextEl = document.getElementById('follow-mouse-text')
    const isFlippedX = mouseX + followMouseTextEl.clientWidth + gap > window.innerWidth
    const isFlippedY = mouseY + followMouseTextEl.clientHeight + gap > window.innerHeight

    followMouseTextEl.style.opacity = 1
    followMouseTextEl.style.left = isFlippedX ? `${mouseX - followMouseTextEl.clientWidth - gap}px` : `${mouseX + gap}px`
    followMouseTextEl.style.top = isFlippedY ? `${mouseY - followMouseTextEl.clientHeight - gap}px` : `${mouseY + gap}px`
}

function playSound(isMuted) {
    if (!isMuted) {
        const buttonPressSoundEl = document.getElementById('button-press-sound')
        buttonPressSoundEl.currentTime = 0
        buttonPressSoundEl.play()
    }
}

function loadSettings() {
    const savedMuteState = localStorage.getItem(STORAGE_KEYS.IS_MUTED)
    if (savedMuteState) {
        const volumeButton = document.getElementById('volumn-button')
        volumeButton.dataset.muted = savedMuteState
    }
}