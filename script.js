'use strict';

document.addEventListener('DOMContentLoaded', () => {
	const field = document.querySelector('.game__field'),
		 keyboard = document.querySelector('.keyboard'),
		 keys = document.querySelectorAll('.keyboard__key'),
		 resetButton = document.querySelector('.reset'),
		 difficultyButtons = document.querySelectorAll('.difficulty__choice'),
		 difficultyBox = document.querySelector('.difficulty'),
		 imgGallows = document.querySelectorAll('.img__gallows'),
		 imgHead = document.querySelectorAll('.img__head'),
		 imgBody = document.querySelector('.img__body'),
		 imgLeftArm = document.querySelector('.img__left-arm'),
		 imgRightArm = document.querySelector('.img__right-arm'),
		 imgLeftLeg = document.querySelector('.img__left-leg'),
		 imgRightLeg = document.querySelector('.img__right-leg'),
		 historyBtn = document.querySelector('.history__btn'),
		 history = document.querySelector('.history'),
		 histContainer = document.querySelector('.history__inner');

	const gallowsParts = [
		imgGallows,
		imgHead,
		imgBody,
		imgLeftArm,
		imgRightArm,
		imgLeftLeg,
		imgRightLeg
	]

	let difficulty = 'easy',
		currentWord = '',
		mistakes = 0,
		gameEnded = false;


	initHistory();

	resetButton.addEventListener('click', () => {
		initGame();
	});

	difficultyButtons.forEach(btn => btn.addEventListener('click', (e) => {
		updateDifficulty(e.target.textContent, e.target);
	}));

	document.addEventListener('keydown', (e) => {
		keys.forEach(key => {
			if (e.key.toLowerCase() === key.textContent) {
				key.classList.add('key_active');
				checkForLetterInWord(e.key.toLowerCase());
				gameOver();
			}
		});
	});

	document.addEventListener('keyup', (e) => {
		keys.forEach(key => {
			if (e.key.toLowerCase() === key.textContent) {
				key.classList.remove('key_active');
			}
		});
	});

	keyboard.addEventListener('click', (e) => {
		const t = e.target;
		checkForLetterInWord(t.textContent.toLowerCase());
		gameOver();
	});

	historyBtn.addEventListener('click', () => {
		history.classList.toggle('history_active');
	});

	history.addEventListener('click', e => {
		if (e.target.classList.contains('history')) {
			history.classList.toggle('history_active');
		}
	});



	function initHistory() {
		let keys = Object.keys(localStorage);
		if (keys.length > 0) {
			for (let key of keys) {
				addToHistory(key);
			}
		} else document.querySelector('.history__inner').textContent = 'история пуста';
	}


	function addToHistory(key) {
		const histElem = document.createElement('div'),
			 histWord = document.createElement('div'),
			 histResult = document.createElement('div');
		histElem.classList.add('history__item');
		switch (localStorage[key]) {
			case 'w':
				histElem.classList.add('history__item_win');
				break;
			case 'l':
				histElem.classList.add('history__item_loose');
				break;
		}
		histWord.classList.add('history__word');
		histWord.textContent = key;
		histResult.classList.add('history__result');
		histResult.textContent = localStorage[key];
		histElem.append(histWord, histResult);
		histContainer.append(histElem);
	}


	function showTheWord() {
		document.querySelectorAll('.game__cell').forEach((cell, i) => {
			cell.textContent = currentWord[i];
		});
	}


	function gameOver() {
		if (checkForVictory()) {
			field.classList.add('game__field_victory');
			endTheGame('w');
		}
		if (mistakes === 7) {
			field.classList.add('game__field_loose');
			showTheWord();
			endTheGame('l');
		}
	}


	function endTheGame(flag) {
		toggleDifficultyBtns(true);
		gameEnded = true;
		localStorage.setItem(currentWord, flag);
		addToHistory(currentWord);
	}


	function checkForVictory() {
		const cellsArr = Array.from(document.querySelectorAll('.game__cell'));
		if (cellsArr.some(cell => cell.textContent === '_')) {
			return false;
		} else if (cellsArr.length > 0) {
			return true;
		} else return false;
	}


	function generateMistake() {
		drawGallows(mistakes);
		mistakes++;
	}


	function checkForLetterInWord(letter) {
		const matches = currentWord.match(new RegExp(letter, 'gd'));
		if (!gameEnded) {
			if (matches) {
				keys.forEach(key => {
					if (key.textContent === matches[0] && !key.classList.contains('keyboard__key_right')) {
						key.classList.add('keyboard__key_right');
					}
				});
				showLetters(matches);
			} else {
				keys.forEach(key => {
					if (key.textContent === letter && !key.classList.contains('keyboard__key_wrong')) {
						key.classList.add('keyboard__key_wrong');
						generateMistake();
					}
				});
			}
		}
	}


	function showLetters(letters) {
		letters.forEach(match => {
			let indexes = findMatchIndexes(match, currentWord);
			const cells = document.querySelectorAll('.game__cell');
			for (let i of indexes) {
				cells[i].textContent = match;
			}
		});
	}


	function findMatchIndexes(match, word) {
		let pos = 0;
		const indexes = [];
		while (true) {
			let i = word.indexOf(match, pos);
			if (i === -1) break;
			else {
				indexes.push(i);
				pos = i + 1;
			}
		}
		return indexes;
	}


	async function initGame() {
		resetKeyboard();
		resetGallows();
		field.classList.remove('game__field_victory', 'game__field_loose');
		gameEnded = false;
		mistakes = 0;
		currentWord = await getWordFromDB()
					.then(db => {
						const word = getRandomElemFromDB(db[difficulty]);
						initGameField(word);
						toggleDifficultyBtns(false);
						return word;
					}).catch(err => {
						field.textContent = 'Произошла ошибка';
						toggleDifficultyBtns(true);
					});
	}


	function resetKeyboard() {
		keys.forEach(key => {
			key.classList.remove('keyboard__key_wrong', 'keyboard__key_right');
		});
	}


	async function getWordFromDB() {
		return await fetch('http://localhost:3000/difficulty')
				.then(response => response.json());
	}


	function getRandomElemFromDB(DB) { // приходит массив слов
		const length = DB.length;
		return DB[Math.round(Math.random() * length)];
	}


	function updateDifficulty(choice, button) {
		difficultyButtons.forEach(btn => btn.classList.remove('difficulty__choice_active'));
		difficulty = choice;
		button.classList.add('difficulty__choice_active');
	}


	function initGameField(word) {
		document.querySelectorAll('.game__cell').forEach(cell => cell.remove());
		console.log(word);
		for (let letter of word) {
			const cell = document.createElement('div');
			cell.classList.add('game__cell');
			cell.textContent = '_';
			field.append(cell);
		}
	}


	function toggleDifficultyBtns(show) {
		if (show) {
			resetButton.classList.add('reset_active');
			difficultyBox.classList.add('difficulty_active');
		} else {
			resetButton.classList.remove('reset_active');
			difficultyBox.classList.remove('difficulty_active');
		}
	}


	function drawGallows(num) {
		if (gallowsParts[num] instanceof NodeList) {
			gallowsParts[num].forEach(part => part.classList.add('img__part_active'));
		} else {
			gallowsParts[num].classList.add('img__part_active');
		}
	}


	function resetGallows() {
		document.querySelectorAll('.gallow-part')
				.forEach(part => part.classList.remove('img__part_active'));
	}
});