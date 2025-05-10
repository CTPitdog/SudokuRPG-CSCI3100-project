
// WinScene.js
export const defineWinScene = (k, setShowSudoku,totalTime, recordMessage) => {
    const BASE_WIDTH = 160;
    const BASE_HEIGHT = 144;
    
    console.log(recordMessage)
    k.scene("win", () => {
      k.add([
        k.text("Game Over!", { size: 16 }),
        k.pos(BASE_WIDTH / 2, BASE_HEIGHT / 2 - 40),
        k.anchor("center"),
        k.layer("ui"),
      ]);

      // Display current total time if "true" ending
    const isTrueEnding = localStorage.getItem('cheat') === 'false';
    if (isTrueEnding) {
      const currentTimeText = `Total time: ${Math.floor(totalTime / 60)}:${(totalTime % 60).toString().padStart(2, '0')}`;
      k.add([
        k.text(currentTimeText, { size: 12 }),
        k.pos(BASE_WIDTH / 2, BASE_HEIGHT / 2-25),
        k.anchor("center"),
        k.layer("ui"),
      ]);
    }

    // Display record message if available
    if (recordMessage) {
      console.log(recordMessage)
      k.add([
        k.text(recordMessage, { size: 12,width:BASE_WIDTH-25 }),
        k.pos(BASE_WIDTH / 2, BASE_HEIGHT / 2),
        k.anchor("center"),
        k.layer("ui"),
      ]);
    }
  
      k.add([
        k.text("Press R to Replay", { size: 12 }),
        k.pos(BASE_WIDTH / 2, BASE_HEIGHT / 2 + 30),
        k.anchor("center"),
        k.layer("ui"),
      ]);
  
      // Handle "R" key press to replay
      k.onKeyPress("r", () => {
        // Reset any necessary state
        setShowSudoku(false); // Ensure Sudoku overlay is hidden
        window.location.href = "/home";
      });
    });
  };