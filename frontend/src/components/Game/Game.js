import React, { useEffect, useState, useRef } from 'react';
import kaplay from "kaplay";
import "./Game.css";
import SudokuGame from '../SudokuGame';
import { defineStage1Scene } from './Gamecomponent/stage1';
import { defineStage2Scene } from './Gamecomponent/stage2';
import { defineStage3Scene } from './Gamecomponent/stage3';
import { defineStage4Scene } from './Gamecomponent/stage4';
import { defineWinScene } from './Gamecomponent/win'; // Import the win scene
import {useNavigate} from 'react-router-dom';

const Game = () => {
  const navigate = useNavigate();
  const [showSudoku, setShowSudoku] = useState(false);
  const kRef = useRef(null);
  const canvasRef = useRef(null);
  const k = useRef(null);
  const videoRef = useRef(null)
  const stagenum = useRef(1);
  const [totalTime, setTotalTime] = useState(0);
  const [showVideo, setShowVideo] = useState(true); // Renamed for consistency
  const [videoSource, setVideoSource] = useState("videos/open.mp4")
  const [recordMessage, setRecordMessage] = useState("");
  const bgMusicRef = useRef(null)

  //disable player movement when video is playing
  const showVideoRef = useRef(showVideo);
  useEffect(() => {
    showVideoRef.current = showVideo;
  }, [showVideo]);

  useEffect(() => {
    let currentuser = localStorage.getItem('user');
    if (currentuser === null) {
      navigate('/login');
    }
    if (videoRef.current) {
      videoRef.current.onended = () => {
        setShowVideo(false);
        if (canvasRef.current) canvasRef.current.focus();
      };
    }
  }, []);

  useEffect(() => {
    const BASE_WIDTH = 160;
    const BASE_HEIGHT = 144;
    const WALL_THICKNESS = 8;
    const WIDTH = BASE_WIDTH;
    const HEIGHT = BASE_HEIGHT;

    k.current = kaplay({
      width: BASE_WIDTH,
      height: BASE_HEIGHT,
      canvas: canvasRef.current,
      background: [0, 0, 0],
      crisp: true,
      stretch: true,
      letterbox: true,
    });

    kRef.current = k.current;

    // Define layers globally ONCE during initialization
    k.current.layers(["bg", "obj", "ui"], "obj");

    // Load assets
    k.current.loadSprite("floor", "sprites/floor.png");
    k.current.loadSprite("map1", "sprites/map1.png");
    k.current.loadSprite("map2", "sprites/map2.png");
    k.current.loadSprite("map3", "sprites/map3.png");
    k.current.loadSprite("enemy", "sprites/enemy1.png", {
      sliceX: 3,
      sliceY: 1,
      anims: { idle: { from: 0, to: 2, loop: true, duration: 100 } },
    });
    k.current.loadSprite("enemy2", "sprites/enemy2.png", {
      sliceX: 2,
      sliceY: 1,
      anims: { idle: { from: 0, to: 1, loop: true, duration: 100 } },
    });
    k.current.loadSprite("enemy3", "sprites/enemy3.png", {
      sliceX: 1,
      sliceY: 1,
      anims: { idle: { from: 0, to: 0, loop: true, duration: 100 } },
    });
    k.current.loadSprite("enemy4", "sprites/enemy4.png", {
      sliceX: 2,
      sliceY: 1,
      anims: { idle: { from: 0, to: 1, loop: true, duration: 100 } },
    });
    k.current.loadSound("bg", "sounds/testbg.mp3");
    k.current.loadSprite("cat", "sprites/cat.png", {
      sliceX: 8,
      sliceY: 10,
      anims: {
        sit1: { from: 0, to: 3, loop: true, duration: 100 },
        sit2: { from: 8, to: 11, loop: true, duration: 100 },
        lick1: { from: 16 , to: 19, loop: true, duration: 100 },
        lick2: { from: 24, to: 27, loop: true, duration: 100 },
      }});

      k.current.loadSprite("prototype", "sprites/Player.png", {
        sliceX: 3,
        sliceY: 4,
        anims: {
          idie: { from: 0, to: 0, loop: true },
          walkup: { from: 3, to: 5, loop: false },
          stopup: { from: 3, to: 3, loop: false },
          walkdown: { from: 0, to: 2, loop: false },
          stopdown: { from: 0, to: 0, loop: false },
          walkright: { from: 6, to: 8, loop: false },
          stopright: { from: 6, to: 6, loop: false },
          walkleft: { from: 9, to: 11, loop: false, flipX: true },
          stopleft: { from: 9, to: 9, loop: false, flipX: true },
        },
      });
    const player = k.current.make([
      k.current.sprite("prototype", { frame: 0 }),
      k.current.scale(2),
      k.current.pos(BASE_WIDTH / 2, BASE_HEIGHT / 2),
      k.current.health(4),
      k.current.area({ scale: 0.8 }),
      k.current.body(),
      k.current.anchor("center"),
      "player",
      k.current.layer("obj"),
    ]);

    let lastDirection = "right";
          
    player.onUpdate(() => {
      // Use k.current.isKeyDown instead of accessing showSudoku directly
      // Since we're in a closure, we can't directly access React state here
      // However, we can rely on the fact that setShowSudoku will pause gameplay
      const speed = 50;
      const diagonalSpeed = speed / Math.sqrt(2);
      let isMoving = false;
      if (showVideoRef.current) return;
      if (k.current.isKeyDown("up")) {
        isMoving = true;
        if (k.current.isKeyDown("right")) {
          player.move(diagonalSpeed, -diagonalSpeed);
          player.play("walkup");
          player.flipX = false;
          lastDirection = "right";
        } else if (k.current.isKeyDown("left")) {
          player.move(-diagonalSpeed, -diagonalSpeed);
          player.play("walkup");
          player.flipX = true;
          lastDirection = "left";
        } else {
          player.move(0, -speed);
          player.play("walkup");
          player.flipX = lastDirection === "left";
        }
      } else if (k.current.isKeyDown("down")) {
        isMoving = true;
        if (k.current.isKeyDown("right")) {
          player.move(diagonalSpeed, diagonalSpeed);
          player.play("walkdown");
          player.flipX = false;
          lastDirection = "right";
        } else if (k.current.isKeyDown("left")) {
          player.move(-diagonalSpeed, diagonalSpeed);
          player.play("walkdown");
          player.flipX = false;
          lastDirection = "left";
        } else {
          player.move(0, speed);
          player.play("walkdown");
          player.flipX = false;
        }
      } else if (k.current.isKeyDown("right")) {
        isMoving = true;
        player.move(speed, 0);
        player.flipX = false;
        if (player.curAnim() !== "walkright") {
          player.play("walkright");
          lastDirection = "right";
        }
      } else if (k.current.isKeyDown("left")) {
        isMoving = true;
        player.move(-speed, 0);
        player.flipX = true;
        if (player.curAnim() !== "walkleft") {
          player.play("walkleft");
          lastDirection = "left";
        }
      }
    
      if (
        player.pos.x < WALL_THICKNESS ||
        player.pos.x > WIDTH - WALL_THICKNESS ||
        player.pos.y < WALL_THICKNESS ||
        player.pos.y > HEIGHT - WALL_THICKNESS
      ) {
        k.current.bgColor = [15, 56, 15];
      } else {
        k.current.bgColor = [0, 0, 0];
      }
    
      if (!isMoving) {
        if (player.curAnim() === "walkright") player.play("stopright");
        else if (player.curAnim() === "walkleft") player.play("stopleft");
        else if (player.curAnim() === "walkup") player.play("stopup");
        else if (player.curAnim() === "walkdown") player.play("stopdown");
      }
    });
    
    player.onKeyPress("space", () => k.current.debug.log(k.current.width()));
  


    // Define scenes by calling the imported functions
    defineStage1Scene(k.current, setShowSudoku,BASE_WIDTH,BASE_HEIGHT,player);
    defineStage2Scene(k.current, setShowSudoku,BASE_WIDTH,BASE_HEIGHT,player);
    defineStage3Scene(k.current, setShowSudoku,BASE_WIDTH,BASE_HEIGHT,player); 
    defineStage4Scene(k.current, setShowSudoku,BASE_HEIGHT,BASE_HEIGHT,player);
    defineWinScene(k.current, setShowSudoku,totalTime,recordMessage); // Define "win" scene


    // Start the game
    k.current.go("stage1", 1);
    bgMusicRef.current = k.current.play("bg", { volume: 0.5, loop: true });


    const resizeCanvas = () => {
      if (canvasRef.current) {
        const scaleX = window.innerWidth / BASE_WIDTH;
        const scaleY = window.innerHeight / BASE_HEIGHT;
        const scale = Math.min(scaleX, scaleY);
        canvasRef.current.style.width = `${BASE_WIDTH * scale}px`;
        canvasRef.current.style.height = `${BASE_HEIGHT * scale}px`;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.location.reload();
    };
  }, []);

  window.onbeforeunload = function () {navigate('/home');}

  const recordTotalTime = async () => {
    console.log("Recording total time:", totalTime);
    const user = localStorage.getItem('user'); // Adjust based on your auth setup
    const email = user ? JSON.parse(user).email : null;
    if (!email) {
      console.error('No user email found');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          totalTime,
        }),
      });
      const result = await response.json();
      if (result.status !== 'success') {
        console.error('Failed to record total time:', result.message);
      } else {
        console.log(result.message);
        setRecordMessage(result.message)
      }
    } catch (error) {
      console.error('Error recording total time:', error);
    }
  };

  const handleSudokuComplete = (won, timeTaken) => {
    setShowSudoku(false);
    if (!kRef.current) return;

    if (won) {
      setTotalTime(prev => prev + timeTaken); // Accumulate time taken for this stage
      const enemies = kRef.current.get("enemy");
      enemies.forEach(enemy => kRef.current.destroy(enemy));
      tonextstage();
    } else {
      setVideoSource("videos/lose.mp4")
      setShowVideo(true)
    }
  };

  const stagelist = ["stage1", "stage2", "stage3", "stage4", "win"];
  const tonextstage = () => {
    let currentStage = kRef.current.getSceneName();
    const currentIndex = stagelist.indexOf(currentStage);
      setShowSudoku(false);      
      stagenum.current += 1;
      let nextstage = stagelist[currentIndex + 1];
      if (nextstage === "win") {
        kRef.current.go("win");
        setShowVideo(true);
        if (localStorage.getItem('cheat')==='false'){
          setVideoSource("videos/true.mp4");
          recordTotalTime();
        }
        else{
          setVideoSource("videos/cheat.mp4");
        }
      }
      else{
      kRef.current.go(nextstage, stagenum.current);
      }
      if (canvasRef.current) canvasRef.current.focus();

  };


  // Control music based on showVideo state
  useEffect(() => {
    if (bgMusicRef.current) {
      if (showVideo) {
        bgMusicRef.current.stop(); // Pause music when video plays
      } else {
        bgMusicRef.current.play(); // Resume music when video stops
      }
    }
  }, [showVideo]);

// Handle video playback and navigation
useEffect(() => {
  if (showVideo && videoRef.current) {
    videoRef.current.load();
    videoRef.current.play().catch(error => {
      console.error("Video playback failed:", error);
    });
    videoRef.current.onended = () => {
      setShowVideo(false);
      if (videoSource === "videos/lose.mp4") {
        navigate('/home'); // Navigate to /home when lose video ends
      } else {
        if (canvasRef.current) canvasRef.current.focus();
      }
    };
  }
}, [showVideo, videoSource, navigate]);

const handleSkipVideo = () => {
  if (videoRef.current) {
    videoRef.current.pause(); // Prevent AbortError
  }
  setShowVideo(false);
  if (videoSource === "videos/lose.mp4") {
    navigate('/home'); // Navigate to /home when skipping lose video
  } else {
    if (canvasRef.current) canvasRef.current.focus();
  }
};

  return (
    <div className="game-container" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#0f380f',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      {showVideo &&
      <div
        style={{
          position: 'absolute',
          width: "100%",
          height: "100%",
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 0,
          background: 'black',
        }}>
        <video
            ref={videoRef}
            autoPlay
            style={{
              width: "95%",
              height: "95%",
            }}
          >
            <source src={videoSource} type="video/mp4" />
          </video>
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          right: 10,
          color: 'white',
        }}>
        <button 
                style={{
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: '1rem',
                  padding: '10px',
                  background: '#306230',
                  color: '#00ff00',
                  border: '2px solid #00ff00',
                  borderRadius: '0',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 0 #0f380f',
                  width: '100px',
                }}
                onClick={handleSkipVideo}
        >Skip</button>
      </div>
      </div>
    }
      <canvas
        id="gameCanvas"
        width={800}
        height={600}
        ref={canvasRef}
        tabIndex={0}
        style={{ imageRendering: 'pixelated' }}
      />
      <div id="sudokuDialog" className="dialog-overlay">
       <div id="dialogbox" className="dialog-box">
      <p id="dialogue">Challenge the enemy to a Sudoku game?</p>
      <button className="yes" id="yesButton">Yes</button>
      <button className="no" id="noButton">No</button>
       </div>
      </div>
      {showSudoku && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10,
        }}>

<div style={{ position: 'absolute', top: '10px', left: '10px', color: 'white' }}>
          Total Time: {Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, '0')}
        </div>
          <div style={{
            position: 'relative',
            height: '100%',
            borderRadius: '10px',
            overflow: 'hidden',
          }}>
          <button onClick={tonextstage} style={{
              position: 'absolute',
              top: '5%',
            }}>Test next stage</button>
            <SudokuGame onComplete={handleSudokuComplete} stage={stagenum.current}/>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;