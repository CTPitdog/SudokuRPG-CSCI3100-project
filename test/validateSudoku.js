const puzzles = require('../backend/SudokuPuzzles');

function validateSudokuSet(numbers) {
    const set = new Set(numbers);
    return set.size === 9 && !set.has(0);
}

function validateSolution(solution) {
    // Check rows
    for (let row = 0; row < 9; row++) {
        if (!validateSudokuSet(solution[row])) {
            return false;
        }
    }

    // Check columns
    for (let col = 0; col < 9; col++) {
        const column = solution.map(row => row[col]);
        if (!validateSudokuSet(column)) {
            return false;
        }
    }

    // Check 3x3 boxes
    for (let boxRow = 0; boxRow < 3; boxRow++) {
        for (let boxCol = 0; boxCol < 3; boxCol++) {
            const box = [];
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    box.push(solution[boxRow * 3 + i][boxCol * 3 + j]);
                }
            }
            if (!validateSudokuSet(box)) {
                return false;
            }
        }
    }

    return true;
}

function validatePuzzleFormat(puzzle) {
    if (!Array.isArray(puzzle) || puzzle.length !== 9) {
        return false;
    }
    
    for (let row of puzzle) {
        if (!Array.isArray(row) || row.length !== 9) {
            return false;
        }
        for (let cell of row) {
            if (!Number.isInteger(cell) || cell < 0 || cell > 9) {
                return false;
            }
        }
    }
    return true;
}

function validatePuzzleSolutionMatch(puzzle, solution) {
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (puzzle[i][j] !== 0 && puzzle[i][j] !== solution[i][j]) {
                return false;
            }
        }
    }
    return true;
}

function countGivenNumbers(puzzle) {
    return puzzle.flat().filter(num => num !== 0).length;
}

function validatePuzzle(puzzle, solution, difficulty, index) {
    console.log(`\nChecking ${difficulty} puzzle #${index + 1}:`);
    
    // Check puzzle format
    if (!validatePuzzleFormat(puzzle)) {
        console.error('❌ Invalid puzzle format');
        return false;
    }

    // Check solution format
    if (!validatePuzzleFormat(solution)) {
        console.error('❌ Invalid solution format');
        return false;
    }

    // Check if solution contains any zeros
    if (solution.flat().includes(0)) {
        console.error('❌ Solution contains zeros');
        console.error('Location of zeros in solution:', solution.map((row, i) => 
            row.map((cell, j) => cell === 0 ? [i, j] : null).filter(x => x)
        ).flat());
        return false;
    }

    // Check if solution is valid
    if (!validateSolution(solution)) {
        console.error('❌ Invalid solution (violates Sudoku rules)');
        return false;
    }

    // Check if puzzle matches solution
    if (!validatePuzzleSolutionMatch(puzzle, solution)) {
        console.error('❌ Puzzle numbers don\'t match solution');
        // Find mismatches
        const mismatches = [];
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (puzzle[i][j] !== 0 && puzzle[i][j] !== solution[i][j]) {
                    mismatches.push(`Position [${i},${j}]: Puzzle=${puzzle[i][j]}, Solution=${solution[i][j]}`);
                }
            }
        }
        console.error('Mismatches:', mismatches);
        return false;
    }

    // Count given numbers
    const givenCount = countGivenNumbers(puzzle);
    console.log(`ℹ️ Number of given cells: ${givenCount}`);
    if (givenCount < 17) {
        console.warn('⚠️ Warning: Less than 17 given numbers (might have multiple solutions)');
    }

    console.log('✅ All checks passed');
    return true;
}

// Validate all puzzles
let allValid = true;
['easy', 'medium', 'hard'].forEach(difficulty => {
    console.log(`\n=== Checking ${difficulty.toUpperCase()} puzzles ===`);
    puzzles[difficulty].forEach((puzzle, index) => {
        if (!validatePuzzle(puzzle.puzzle, puzzle.solution, difficulty, index)) {
            allValid = false;
        }
    });
});

if (!allValid) {
    console.error('\n❌ Some puzzles have issues!');
    process.exit(1);
} else {
    console.log('\n✅ All puzzles are valid!');
    process.exit(0);
} 