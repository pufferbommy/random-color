init()

async function init() {
    const randomButtonEl = document.getElementById('random-button')
    const followMouseTextEl = document.getElementById('follow-mouse-text')
    const volumnButtonEl = document.getElementById('volumn-button')
    const repoLinkEl = document.getElementById('repo-link')
    const gap = 32

    loadSettings()

    let mouseX, mouseY, isMuted = JSON.parse(volumnButtonEl.dataset.muted)

    const colors = await getColors()
    let randomColor = getRandomColor(colors)
    updateDisplay(randomColor)

    randomButtonEl.addEventListener('click', (event) => {
        event.stopPropagation()
        randomColor = getRandomColor(colors)
        updateDisplay(randomColor)
        if (!isMuted) playButtonPressSound()
    })
    randomButtonEl.addEventListener('mouseenter', (event) => {
        followMouseTextEl.innerText = 'Click to random new color.'
    })
    randomButtonEl.addEventListener('mouseleave', (event) => {
        followMouseTextEl.innerText = 'Click anywhere to copy color.'
    })

    repoLinkEl.addEventListener('click', (event) => {
        event.stopPropagation()
        if (!isMuted) playButtonPressSound()
    })
    repoLinkEl.addEventListener('mouseenter', (event) => {
        followMouseTextEl.innerText = 'Go to source code.'
    })
    repoLinkEl.addEventListener('mouseleave', (event) => {
        followMouseTextEl.innerText = 'Click anywhere to copy color.'
    })

    volumnButtonEl.addEventListener('click', (event) => {
        event.stopPropagation()
        isMuted = !isMuted
        volumnButtonEl.dataset.muted = JSON.stringify(isMuted)
        localStorage.setItem('isMuted', JSON.stringify(isMuted))
        followMouseTextEl.innerText = isMuted ? 'Click to unmute.' : 'Click to mute.'
        if (!isMuted) playButtonPressSound()
    })
    volumnButtonEl.addEventListener('mouseenter', (event) => {
        followMouseTextEl.innerText = isMuted ? 'Click to unmute.' : 'Click to mute.'
    })
    volumnButtonEl.addEventListener('mouseleave', (event) => {
        followMouseTextEl.innerText = 'Click anywhere to copy color.'
    })

    document.body.addEventListener('click', (event) => {
        navigator.clipboard.writeText(randomColor.hex);
        showAlert(mouseX, mouseY, gap)
        if (!isMuted) playButtonPressSound()
    })
    document.body.addEventListener('mousemove', (event) => {
        mouseX = event.clientX
        mouseY = event.clientY
        updateFollowMouseText(mouseX, mouseY, gap)
    })
}

async function getColors() {
    const response = await fetch('https://raw.githubusercontent.com/jonathantneal/color-names/refs/heads/master/color-names.json')
    const colors = await response.json()
    return colors
}

function getRandomColor(colors) {
    const colorKeys = Object.keys(colors)
    const randomColorKey = colorKeys[randomNumber(0, colorKeys.length - 1)]
    const randomColor = {
        name: colors[randomColorKey],
        hex: randomColorKey
    }
    return randomColor
}

function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function getLightness(r, g, b) {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709
}

function isDarkBackground(r, g, b) {
    return getLightness(r, g, b) < 90;
}

function hexToRgb(hex) {
    return hex.match(/[A-Za-z0-9]{2}/g).map(v => parseInt(v, 16))
}

function updateDisplay(randomColor) {
    document.getElementById('color-name').textContent = randomColor.name
    document.getElementById('color-hex').textContent = randomColor.hex
    document.body.style.backgroundColor = randomColor.hex
    document.title = `${randomColor.name} - ${randomColor.hex}`
    document.body.style.color = isDarkBackground(...hexToRgb(randomColor.hex)) ? 'white' : 'black'
    document.querySelector('#repo-link img').style.filter = isDarkBackground(...hexToRgb(randomColor.hex)) ? 'invert(1)' : 'invert(0)'
}

function showAlert(mouseX, mouseY, gap) {
    const alertEl = document.createElement('div')
    alertEl.classList.add('alert')
    const hexColor = document.getElementById('color-hex').textContent;
    alertEl.innerHTML = `Copy color <span style="background-color: ${hexColor}; color: ${document.body.style.color}">${hexColor}</span> to clipboard successfully!`
    alertEl.style.animation = 'float 3s forwards' 
    document.body.appendChild(alertEl)
    const isFlippedX = mouseX + alertEl.clientWidth + gap > window.innerWidth
    const isFlippedY = mouseY - alertEl.clientHeight - gap <= 0
    alertEl.style.left = isFlippedX ? mouseX - alertEl.clientWidth - gap + "px" : mouseX + gap + 'px'
    alertEl.style.top = isFlippedY ? mouseY + alertEl.clientHeight + "px" : mouseY - alertEl.clientHeight + 'px'
    alertEl.addEventListener('animationend', () => {
        alertEl.remove()
    })
}

function updateFollowMouseText(mouseX, mouseY, gap) {
    const followMouseTextEl = document.getElementById('follow-mouse-text')
    const isFlippedX = mouseX + followMouseTextEl.clientWidth + gap > window.innerWidth
    const isFlippedY = mouseY + followMouseTextEl.clientHeight + gap > window.innerHeight
    followMouseTextEl.style.opacity = 1
    followMouseTextEl.animate([{
        left: isFlippedX ? mouseX - followMouseTextEl.clientWidth - gap + "px" : mouseX + gap + 'px',
        top: isFlippedY ? mouseY - followMouseTextEl.clientHeight - gap + "px" : mouseY + gap + 'px'
    }], {
        duration: 750,
        fill: 'forwards'
    })
}

function playButtonPressSound() {
    const buttonPressSoundEl = document.getElementById('button-press-sound')
    buttonPressSoundEl.currentTime = 0
    buttonPressSoundEl.play()
}

function loadSettings() {
    if(localStorage.getItem('isMuted')) {
        const volumnButtonEl = document.getElementById('volumn-button')
        volumnButtonEl.dataset.muted = localStorage.getItem('isMuted')   
    }
}