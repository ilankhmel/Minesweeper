'use strict'

var gLevel
var gGame
var hintMode
var gBoard
var firstClickMade
var time0
var time
var gTimerInterval
localStorage.checkHighScore = 50
var manualBombs

const START_SMILE = '🙂'
const WIN_SMILE = '😎'
const LOSE_SMILEY = '🤯'
const HEART = '❤️'
const LIGHTBULB = '💡'
const TROPHY = '🏆'
const CLOCK = '⏰'
const SAFE_CLICK = '🤫'
const MINE = '💣'
const BOOM = '💥'
const MARK = '✅'
const SCREEN = '⌨'

function init() {

    gLevel = {
        SIZE: 6,
        MINES: 2,
        HINTS: 3,
        SAFE_CELL: 3,
    };

    gGame = {
        isOn: false,
        shownCount: 0,
        markedCount: 0,
        secsPassed: 0,
        lives: 2,

    }

    hintMode = false
    firstClickMade = false
    clearInterval(gTimerInterval)
    manualBombs = false
    gBoard = buildBoard(gLevel.SIZE)
    renderBoard(gBoard)
}

function buildBoard(size) {
    var board = []
    for (let i = 0; i < size; i++) {
        board[i] = []
        for (let j = 0; j < size; j++) {
            board[i][j] = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false

            }
        }

    }
    return board
}

function setMinesNegsCount(board) {

    //Loops over all cells and count bombs around
    //using 'countBombsAround'

    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[0].length; j++) {
            countBombsAround(board, i, j)

        }

    }
    return board
}


function countBombsAround(board, rowIdx, colIdx) {
    var checkedCell = board[rowIdx][colIdx]
    if (checkedCell.isMine) return
    for (let i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i > board.length - 1) continue
        var currRow = board[i]
        for (let j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= board[0].length) continue
            if (i === rowIdx && j === colIdx) continue

            var currCell = currRow[j]
            if (currCell.isMine) checkedCell.minesAroundCount++

        }

    }

}

function renderBoard(board) {
    var strHTML = ''
    for (let i = 0; i < board.length; i++) {
        strHTML += `\n<tr class="board-row" >`
        for (let j = 0; j < board[0].length; j++) {
            var currCell = board[i][j]
            var className = `cell cell-${i}-${j}` // ${(currCell.isMine) ? 'mine' : ''
            strHTML += `\n\t<td class="${className}" onclick="cellClicked(this, ${i}, ${j})" oncontextmenu="cellMarked(this, ${i}, ${j})"></td>\n`

        }
        strHTML += `\n</tr>`

    }

    //Rendering gBoard Elements:

    document.querySelector('.reset-btn').innerText = START_SMILE
    document.querySelector('tbody').innerHTML = strHTML
    document.querySelector('.lives').innerText = gGame.lives + HEART
    document.querySelector('.hint').innerText = gLevel.HINTS + LIGHTBULB
    document.querySelector('.high-score').innerText = localStorage.checkHighScore + TROPHY
    document.querySelector('.timer').innerHTML = 0 + CLOCK
    document.querySelector(`.safe-click`).innerHTML = gLevel.SAFE_CELL + SAFE_CLICK
    document.querySelector(`.manual-mines`).innerHTML = 'Manual - ' + MINE
    document.querySelector(`.seven-boom`).innerHTML = '7Boom ' + BOOM
    document.querySelector(`.dark-mode`).innerHTML = 'Dark Mode ' + SCREEN

}

function cellClicked(el, i, j) {
    gGame.isOn = true

    var elCell = el
    var cell = gBoard[i][j]

    if (cell.isShown) return

    if (!gGame.lives) return

    if (hintMode && gGame.isOn) {
        showHint(gBoard, i, j)
        return
    }

    if(manualBombs && gGame.isOn){

        addManualMines(el, i, j)
        return
    }

    if (cell.isMine) {
        //Model
        cell.isShown = true
        gGame.shownMinesCount++
        gGame.lives--
        //DOM
        elCell.innerText = MINE
        elCell.classList.add('open-mine')
        document.querySelector('.lives').innerText = gGame.lives + HEART
    }

    if (cell.minesAroundCount === 0 && !cell.isMine) {
        //Model
        cell.isShown = true
        gGame.shownCount++
        //DOM
        elCell.classList.add('open-cell')
        
        //Before the first click, the board has 0 mines
        if (!firstClickMade) {
            //--First click--

            //Start timer
            time0 = Date.now()
            startTimer()

            //Set mines 
            for (let k = 0; k < gLevel.MINES; k++) {
                getRandomMines(gBoard, i, j)
            }
            
            //Setting negs counts
            setMinesNegsCount(gBoard)
            firstClickMade = true

        } else {
            expandShown(gBoard, el, i, j)
        }
        
    }


    if (cell.minesAroundCount) {

        //Model
        cell.isShown = true
        gGame.shownCount++

        //DOM
        elCell.innerText = gBoard[i][j].minesAroundCount
        switch (gBoard[i][j].minesAroundCount) {
            case 1:
                elCell.style.color = 'blue'
                break;

            case 2:
                elCell.style.color = 'green'
                break;

            case 3:
                elCell.style.color = 'red'
                break;
                
        
            default:
                break;
        }

        elCell.classList.add('open-cell')

        
    }

    checkGameOver()

}


function expandShown(board, elCell, iIdx, jIdx) {
    for (let i = iIdx - 1; i <= iIdx + 1; i++) {
        if (i < 0 || i > board.length - 1) continue
        for (let j = jIdx - 1; j <= jIdx + 1; j++) {
            if (j < 0 || j > board[0].length - 1) continue
            if (i === iIdx && j === jIdx) continue

            var currCell = board[i][j]
            var className = `cell-${i}-${j}`
            var elCell = document.querySelector(`.${className}`)
            
            if(!currCell.isShown){
            currCell.isShown = true
            gGame.shownCount++
            elCell.classList.add('open-cell')
            }
            
            if (currCell.minesAroundCount > 0) {
                elCell.innerText = currCell.minesAroundCount
                switch (gBoard[i][j].minesAroundCount) {
                    case 1:
                        elCell.style.color = 'blue'
                        break;
        
                    case 2:
                        elCell.style.color = 'green'
                        break;
        
                    case 3:
                        elCell.style.color = 'red'
                        break;
                        
                
                    default:
                        break;
                }
            }

        }

    }
}


function cellMarked(el, i, j) {
    var elCell = el
    var cell = gBoard[i][j]

    if (cell.isMarked) {
        elCell.innerText = ''
        elCell.classList.remove('flagged')
        cell.isMarked = false
        gGame.markedCount--

    } else if (!cell.isMarked && !cell.isShown) {
        elCell.innerText = '🚩'
        elCell.classList.add('flagged')
        cell.isMarked = true
        gGame.markedCount++

    }

}

function checkGameOver() {

    var resetBtn = document.querySelector('.reset-btn')
    if (gGame.shownCount === gLevel.SIZE ** 2 - gLevel.MINES) {
        console.log('You Win!');
        gGame.isOn = false
        resetBtn.innerText = '😎'
        clearInterval(gTimerInterval)
        checkHighScore()
    }

    if (!gGame.lives) {
        console.log('You Lose');
        gGame.isOn = false
        resetBtn.innerText = '🤯'
        clearInterval(gTimerInterval)

    }
}


function getRandomMines(board, i, j) {

    var randNum1 = getRandomInt(0, gLevel.SIZE)
    var randNum2 = getRandomInt(0, gLevel.SIZE)

    while (randNum1 === i && randNum2 === j) {
        randNum1 = getRandomInt(0, gLevel.SIZE)
        randNum2 = getRandomInt(0, gLevel.SIZE)
    }

    return board[randNum1][randNum2] = { isShown: false, isMine: true, isMarked: false }

}


function hintBtnClick() {
    var elHintBtn = document.querySelector('.hint')
    if (!hintMode) {
        hintMode = true
        elHintBtn.classList.add('selected')
    } else {
        hintMode = false
        elHintBtn.classList.remove('selected')
    }
}

function showHint(board, rowIdx, colIdx) {

    if (!gLevel.HINTS) return

    if(!firstClickMade){
        alert('Make a move first!')
        return
    } 

    //MODEL
    gLevel.HINTS--

    //DOM
    document.querySelector('.hint').innerText = gLevel.HINTS + LIGHTBULB

    for (let i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i > board.length - 1) continue
        var currRow = board[i]
        for (let j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= board[0].length) continue
            var currCell = currRow[j]

            var className = `cell-${i}-${j}`
            var elCell = document.querySelector(`.${className}`)

            if (!currCell.isShown) {
                if (currCell.isMine) {
                    elCell.innerText = MINE
                } else if (!currCell.isMine && currCell.minesAroundCount) {
                    elCell.innerText = currCell.minesAroundCount
                }

                elCell.classList.add('showingHint')
            }
        }

    }

    //Turn off after 1 sec
    setTimeout(() => {
        var hintedEls = document.querySelectorAll('.showingHint')
        console.log(hintedEls);
        for (let i = 0; i < hintedEls.length; i++) {

            hintedEls[i].classList.remove('showingHint')
            hintedEls[i].innerText = ''
            hintMode = false
            document.querySelector('.hint').classList.remove('selected')

        }
    }, 1000)


}

function startTimer() {

    gTimerInterval = setInterval(() => {
        var diff = (Date.now() - time0)

        if (diff.toString().length === 4) time = (diff.toString().substring(0, 1));
        if (diff.toString().length === 5) time = (diff.toString().substring(0, 2));
        if (diff.toString().length === 6) time = (diff.toString().substring(0, 3));

        document.querySelector('.timer').innerHTML = time + CLOCK

    }, 1000)
}

function checkHighScore() {
    //Model
    if (Number(time) < Number(localStorage.checkHighScore)) localStorage.checkHighScore = Number(time)
    //DOM
    document.querySelector('.high-score').innerText = localStorage.checkHighScore + TROPHY
}

function showSafeCell() {
    if (gLevel.SAFE_CELL) {
        var safeIdxs = []
        for (let i = 0; i < gBoard.length; i++) {
            for (let j = 0; j < gBoard[0].length; j++) {
                var currCell = gBoard[i][j]

                if (!currCell.isMine && !currCell.isShown) safeIdxs.push({ i, j })
            }

        }

        var randIdx = getRandomInt(0, safeIdxs.length)
        var randCords = safeIdxs[randIdx]

        var className = `cell-${randCords.i}-${randCords.j}`
        var elCell = document.querySelector(`.${className}`)
        
        //Model
        gLevel.SAFE_CELL--

        //DOM
        elCell.classList.add('safe-cell')
        document.querySelector(`.safe-click`).innerHTML = gLevel.SAFE_CELL + SAFE_CLICK

        //Turn off after 700ms
        setTimeout(() => {
            elCell.classList.remove('safe-cell')
        }, 700)
    }
}

function show7BoomMines() {
    init()
    firstClickMade = true

    for (let i = 0; i < gBoard.length; i++) {
        for (let j = 0; j < gBoard[0].length; j++) {
            var currCell = gBoard[i][j]

            if (currCell.isMine &&
                i === 7 ||
                j === 7 ||
                i % 7 === 0 &&
                j % 7 === 0) {

                gBoard[i][j] = { isShown: false, isMine: true, isMarked: false }
            }
        }

    }
}


function manualMinesBtnClick(el) {
   // if(!gGame.isOn) return

   var elTime = document.querySelector(`.timer`)
    var time = elTime.innerText

    //If game started already
    if(Number(time.slice(0, 1)) !== 0){
        alert('Use manual on clear board only')
        return
    }

    var manualBtn = document.querySelector('.manual-mines')
    
    if (!manualBombs) {
        //Model
        manualBombs = true
        //DOM
        manualBtn.classList.add('selected')

    } else {
        //Model
        manualBombs = false

        //DOM
        manualBtn.classList.remove('selected')

        for (let i = 0; i < gBoard.length; i++) {
            for (let j = 0; j < gBoard[0].length; j++) {
                var className = `cell-${i}-${j}`
                var elCell = document.querySelector(`.${className}`)
                if(elCell.innerText === MARK){
                    elCell.innerText = ''
                }
                
            }
            
        }
        setMinesNegsCount(gBoard)
        
    }
}

function switchDarkMode(){
    const theme = document.querySelector("#theme-link");
    var darkBtn = document.querySelector('.dark-mode');
    if (theme.getAttribute("href") === "css/main.css") {
        theme.href = "css/darkmain.css";
        darkBtn.innerText = 'Light Mode ' + SCREEN
      } else {
        theme.href = "css/main.css";
        darkBtn.innerText = 'Dark Mode ' + SCREEN
    }
}

function addManualMines(el, i, j){
    
    //Model
    firstClickMade = true
    gBoard[i][j].isMine = true

    //DOM
    el.innerText = MARK
    

}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

