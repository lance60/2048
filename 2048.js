// TILE_SPAWN_TABLE.length must always equal TILE_SPAWN_RATE.length
// Each tile must have corresponding spawn rate
const TILE_SPAWN_TABLE = [2, 4];
const TILE_SPAWN_RATE = [90, 10];
const WINNING_TILE = 2048;

class Coordinate
{
	constructor(x, y)
	{
		this.x = x;
		this.y = y;
	}
	
	getDistance(otherCoord)
	{
		return Math.sqrt(Math.pow(otherCoord.x - this.x, 2) + Math.pow(otherCoord.y - this.y, 2));
	}
}

class GameBoard
{
	constructor(width, height)
	{
		this.width = width;
		this.height = height;
		this.score = 0;
		this.moves = 0;
		this.cumulativeProbability = 0;
		this.hasWon = false;
		this.emptyTileTable;
		this.boardState;
		
		for(let i = 0; i < TILE_SPAWN_RATE.length; i++)
		{
			this.cumulativeProbability += TILE_SPAWN_RATE[i];
		}
		
		this.initializeBoard();
		this.generateEmptyTileTable();
		this.spawnTile();
		this.spawnTile();
	}
	
	copyState(gameBoard)
	{
		this.width = gameBoard.width;
		this.height = gameBoard.height;
		this.score = gameBoard.score;
		this.moves = gameBoard.moves;
		
		this.boardState = [];
		
		for(let i = 0; i < this.width; i++)
		{
			this.boardState[i] = [];
		}
		
		for(let i = 0; i < this.width; i++)
		{
			for(let j = 0; j < this.height; j++)
			{
				this.boardState[i][j] = gameBoard.boardState[i][j];
			}
		}
		
		this.generateEmptyTileTable();
	}
	
	initializeBoard()
	{
		this.boardState = []
		
		for(let i = 0; i < this.width; i++)
		{
			this.boardState[i] = [];

			for(let j = 0; j < this.height; j++)
			{
				this.boardState[i][j] = 0;
			}
		}
	}
	
	generateEmptyTileTable()
	{
		this.emptyTileTable = [];
		
		for(let i = 0; i < this.width; i++)
		{
			for(let j = 0; j < this.height; j++)
			{
				if(this.boardState[i][j] == 0)
				{
					this.emptyTileTable.push(new Coordinate(i,j));
				}
			}
		}
	}
	
	generateTileValue()
	{
		// https://stackoverflow.com/questions/25991198/game-design-theory-loot-drop-chance-spawn-rate
		let randomValue = Math.round(Math.random() * this.cumulativeProbability);
		let rangeMin = 0
		
		for(let i = 0; i < TILE_SPAWN_TABLE.length - 1; i++)
		{
			let rangeMax = TILE_SPAWN_RATE[i];
			
			if(randomValue >= rangeMin && randomValue < rangeMax)
			{
				return TILE_SPAWN_TABLE[i];
			}
			
			rangeMin = rangeMax;
		}
		
		return TILE_SPAWN_TABLE[TILE_SPAWN_TABLE.length - 1];
	}
	
	isInBounds(coord)
	{
		return coord.x >= 0 && coord.x < this.width && coord.y >= 0 && coord.y < this.height;
	}
	
	grabTile(coord)
	{
		if(this.isInBounds(coord))
		{
			return this.boardState[coord.x][coord.y];
		}
		
		return undefined;
	}
	
	spawnTile()
	{
		let tileCoord = this.emptyTileTable[Math.floor(Math.random() * (this.emptyTileTable.length))];
		let tileValue = this.generateTileValue();
		
		this.boardState[tileCoord.x][tileCoord.y] = tileValue
		this.generateEmptyTileTable();
	}
	
	shiftMovableTile(tileSet)
	{
		let score = 0;
		let offsetMin = 0;
		
		for(let i = 1; i < tileSet.length; i++)
		{
			if(tileSet[i] != 0)
			{
				let offset = i;
				
				let curTileValue = tileSet[i];
				tileSet[i] = 0;
				
				while(offset >= offsetMin && tileSet[offset] == 0)
				{
					offset--;
					
					if(tileSet[offset] != 0 || offset <= offsetMin)
					{
						if(tileSet[offset] <= 0 || tileSet[offset] == curTileValue)
						{
							if(tileSet[offset] == curTileValue)
							{
								score += tileSet[offset] + curTileValue;
								offsetMin++;
							}
							tileSet[offset] += curTileValue;
						}
						else
						{
							tileSet[offset + 1] = curTileValue;
						}
					}
				}
			}
		}
		
		return score;
	}
	
	// Due to the need to traverse arrays differently, most functions
	// below are almost identical to each other
	
	moveUp()
	{
		if(this.isUpMovementPossible())
		{
			for(let i = 0; i < this.width; i++)
			{
				let tileSet = new Array(this.height);
				
				for(let j = 0; j < this.height; j++)
				{
					tileSet[j] = this.grabTile(new Coordinate(i, j));
				}
				
				this.score += this.shiftMovableTile(tileSet);
				
				for(let j = 0; j < this.height; j++)
				{
					this.boardState[i][j] = tileSet[j];
				}
			}
			
			if(!this.hasWon)
			{
				this.hasWon = this.hasTile(WINNING_TILE);
			}
			
			this.generateEmptyTileTable();
			this.spawnTile();
			this.moves++;
			return true;
		}
		
		return false;
	}
	
	moveDown()
	{
		if(this.isDownMovementPossible())
		{
			for(let i = 0; i < this.width; i++)
			{
				let tileSet = new Array(this.height);
				
				for(let j = this.height - 1; j >= 0; j--)
				{
					tileSet[this.height - 1 - j] = this.grabTile(new Coordinate(i, j));
				}
				
				this.score += this.shiftMovableTile(tileSet);
				
				for(let j = this.height - 1; j >= 0; j--)
				{
					this.boardState[i][j] = tileSet[this.height - 1 - j];
				}
			}
			
			if(!this.hasWon)
			{
				this.hasWon = this.hasTile(WINNING_TILE);
			}
			
			this.generateEmptyTileTable();
			this.spawnTile();
			this.moves++;
			return true;
		}
		
		return false;
	}
	
	moveLeft()
	{
		if(this.isLeftMovementPossible())
		{
			for(let j = 0; j < this.height; j++)
			{
				let tileSet = new Array(this.width);
				
				for(let i = 0; i < this.width; i++)
				{
					tileSet[i] = this.grabTile(new Coordinate(i, j));
				}
				
				this.score += this.shiftMovableTile(tileSet);
				
				for(let i = 0; i < this.width; i++)
				{
					this.boardState[i][j] = tileSet[i];
				}
			}
			
			if(!this.hasWon)
			{
				this.hasWon = this.hasTile(WINNING_TILE);
			}
			
			this.generateEmptyTileTable();
			this.spawnTile();
			this.moves++;
			return true;
		}
		
		return false;
	}
	
	moveRight()
	{
		if(this.isRightMovementPossible())
		{
			for(let j = 0; j < this.height; j++)
			{
				let tileSet = new Array(this.width);
				
				for(let i = this.width - 1; i >= 0; i--)
				{
					tileSet[this.width - 1 - i] = this.grabTile(new Coordinate(i, j));
				}
				
				this.score += this.shiftMovableTile(tileSet);
				
				for(let i = this.width - 1; i >= 0; i--)
				{
					this.boardState[i][j] = tileSet[this.width - 1 - i];
				}
			}
			
			if(!this.hasWon)
			{
				this.hasWon = this.hasTile(WINNING_TILE);
			}
			
			this.generateEmptyTileTable();
			this.spawnTile();
			this.moves++;
			return true;
		}
		
		return false;
	}
	
	
	// This function is not meant to be used on up edge tiles
	// (Tile coordinates that has y = 0)
	canMoveUp(tileCoord)
	{
		let curTileVal = this.grabTile(tileCoord);
		let upTileVal = this.grabTile(new Coordinate(tileCoord.x, tileCoord.y - 1));
		
		return upTileVal == 0 || upTileVal == curTileVal;
	}
	
	
	// This function is not meant to be used on down edge tiles
	// (Tile coordinates that has y = this.height - 1)
	canMoveDown(tileCoord)
	{
		let curTileVal = this.grabTile(tileCoord);
		let downTileVal = this.grabTile(new Coordinate(tileCoord.x, tileCoord.y + 1));
		
		return downTileVal == 0 || downTileVal == curTileVal;
	}
	
	
	// This function is not meant to be used on left edge tiles
	// (Tile coordinates that has x = 0)
	canMoveLeft(tileCoord)
	{
		let curTileVal = this.grabTile(tileCoord);
		let leftTileVal = this.grabTile(new Coordinate(tileCoord.x - 1, tileCoord.y));
		
		return leftTileVal == 0 || leftTileVal == curTileVal;
	}
	
	// This function is not meant to be used on positive x edge tiles
	// (Tile coordinates that has x = this.width - 1)
	canMoveRight(tileCoord)
	{
		let curTileVal = this.grabTile(tileCoord);
		let rightTileVal = this.grabTile(new Coordinate(tileCoord.x + 1, tileCoord.y));
		
		return rightTileVal == 0 || rightTileVal == curTileVal;
	}
	
	isUpMovementPossible()
	{
		for(let i = 0; i < this.width; i++)
		{
			for(let j = 1; j < this.height; j++)
			{
				let curCoord = new Coordinate(i, j);
				if(this.grabTile(curCoord) != 0 && this.canMoveUp(curCoord))
				{
					return true;
				}
			}
		}
		
		return false;
	}
	
	isDownMovementPossible()
	{
		for(let i = 0; i < this.width; i++)
		{
			for(let j = 0; j < this.height - 1; j++)
			{
				let curCoord = new Coordinate(i, j);
				if(this.grabTile(curCoord) != 0 && this.canMoveDown(curCoord))
				{
					return true;
				}
			}
		}
		
		return false;
	}
	
	isLeftMovementPossible()
	{
		for(let i = 1; i < this.width; i++)
		{
			for(let j = 0; j < this.height; j++)
			{
				let curCoord = new Coordinate(i, j);
				if(this.grabTile(curCoord) != 0 && this.canMoveLeft(curCoord))
				{
					return true;
				}
			}
		}
		
		return false;
	}
	
	isRightMovementPossible()
	{
		for(let i = 0; i < this.width - 1; i++)
		{
			for(let j = 0; j < this.height; j++)
			{
				let curCoord = new Coordinate(i, j);
				if(this.grabTile(curCoord) != 0 && this.canMoveRight(curCoord))
				{
					return true;
				}
			}
		}
		
		return false;
	}
	
	isGameOver()
	{
		return !this.isUpMovementPossible() && !this.isDownMovementPossible() && !this.isLeftMovementPossible() && !this.isRightMovementPossible();
	}
	
	hasTile(tile)
	{
		for(let i = 0; i < this.width; i++)
		{
			for(let j = 0; j < this.height; j++)
			{
				if(this.grabTile(new Coordinate(0,0)) == tile)
				{
					return true;
				}
			}
		}
		
		return false;
	}
}

const Direction = {
	NONE: -1,
	UP: 0,
	DOWN: 1,
	LEFT: 2,
	RIGHT: 3,
	TOTAL: 4
};
Object.freeze(Direction);

class MoveData
{
	constructor(direction)
	{
		this.score = Number.MIN_VALUE;
		this.isValidMove = false;
		this.direction = direction;
	}
}

class EvaluationSetting
{
	constructor(scoreWeight, emptyTileWeight, monotonicityWeight, roughnessPenaltyWeight, monotonicityRVal)
	{
		this.scoreWeight = scoreWeight;
		this.emptyTileWeight = emptyTileWeight;
		this.monotonicityWeight = monotonicityWeight;
		this.roughnessPenaltyWeight = roughnessPenaltyWeight;
		this.monotonicityRVal = monotonicityRVal;
	}
}

class BoardPossibility
{
	constructor(gameBoard, direction, evaluationSettings)
	{
		this.gameBoard = new GameBoard(gameBoard.width, gameBoard.height);
		this.gameBoard.copyState(gameBoard);
		this.movementDirection = Direction.NONE;
		this.movementDirectionPrint = "None";
		this.isValidMove = false;
		
		if(direction == Direction.UP)
		{
			this.isValidMove = this.gameBoard.moveUp();
			this.movementDirectionPrint = "Up";
			this.movementDirection = direction;
		}
		else if(direction == Direction.DOWN)
		{
			this.isValidMove = this.gameBoard.moveDown();
			this.movementDirectionPrint = "Down";
			this.movementDirection = direction;
		}
		else if(direction == Direction.LEFT)
		{
			this.isValidMove = this.gameBoard.moveLeft();
			this.movementDirectionPrint = "Left";
			this.movementDirection = direction;
		}
		else if(direction == Direction.RIGHT)
		{
			this.isValidMove = this.gameBoard.moveRight();
			this.movementDirectionPrint = "Right";
			this.movementDirection = direction;
		}
		
		this.scoreDifference = this.gameBoard.score - gameBoard.score;
		this.numEmptyTiles = this.gameBoard.emptyTileTable.length;
		this.moveScore = this.calculateMoveScore(evaluationSettings);
	}
	
	getCoordOfHighestTile()
	{
		let coord = new Coordinate(0,0);
		let highestVal = this.gameBoard.grabTile(coord);
		
		for(let i = 0; i < this.gameBoard.width; i++)
		{
			for(let j = 0; j < this.gameBoard.height; j++)
			{
				let newCoord = new Coordinate(i,j);
				let newVal = this.gameBoard.grabTile(newCoord);
				
				if(newVal > highestVal)
				{
					highestVal = newVal;
					coord = newCoord;
				}
			}
		}
		return coord;
	}
	
	calculateRoughnessPenalty()
	{
		let penalty = 0;
		for(let i = 0; i < this.gameBoard.width; i++)
		{
			for(let j = 0; j < this.gameBoard.height; j++)
			{
				let adjacentTiles = [
					this.gameBoard.grabTile(new Coordinate(i, j - 1)),
					this.gameBoard.grabTile(new Coordinate(i, j + 1)),
					this.gameBoard.grabTile(new Coordinate(i - 1, j)),
					this.gameBoard.grabTile(new Coordinate(i + 1, j))
				];
				
				for(let k = 0; k < adjacentTiles.length; k++)
				{
					if(adjacentTiles[k] != undefined)
					{
						penalty += Math.abs(this.gameBoard.grabTile(new Coordinate(i,j)) - adjacentTiles[k]);
					}
				}
			}
		}
		
		return penalty;
	}
	
	unfoldBoardVertical(otherSide, reversed)
	{
		let unfoldedBoard = [];
		let switchDir = reversed;
		
		for(let i = 0; i < this.gameBoard.width; i++)
		{
			for(let j = 0; j < this.gameBoard.height; j++)
			{
				let coord = new Coordinate(i, j);
				
				if(switchDir)
				{
					coord.y = this.gameBoard.height - j - 1;
				}
				
				if(otherSide)
				{
					coord.x = this.gameBoard.width - i - 1;
				}
				
				unfoldedBoard.push(this.gameBoard.grabTile(coord));
			}
			
			if(switchDir)
			{
				switchDir = false;
			}
			else
			{
				switchDir = true;
			}
		}
		
		return unfoldedBoard;
	}
	
	unfoldBoardHorizontal(otherSide, reversed)
	{
		let unfoldedBoard = [];
		let switchDir = reversed;
		
		for(let j = 0; j < this.gameBoard.height; j++)
		{
			for(let i = 0; i < this.gameBoard.width; i++)
			{
				let coord = new Coordinate(i, j);
				
				if(switchDir)
				{
					coord.x = this.gameBoard.width - i - 1;
				}
				
				if(otherSide)
				{
					coord.y = this.gameBoard.height - j - 1;
				}
				
				unfoldedBoard.push(this.gameBoard.grabTile(coord));
			}
			
			if(switchDir)
			{
				switchDir = false;
			}
			else
			{
				switchDir = true;
			}
		}
		
		return unfoldedBoard;
	}
	
	calculateOrderScore(order, rVal)
	{
		let score = 0;
		
		for(let i = 0; i < order.length; i++)
		{
			score += order[i] * Math.pow(rVal, i);
		}
		
		return score;
	}
	
	calculateMonotonicity(rVal)
	{
		let upperLeftPathOne = this.calculateOrderScore(this.unfoldBoardVertical(false, false), rVal);
		let upperLeftPathTwo = this.calculateOrderScore(this.unfoldBoardHorizontal(false, false), rVal);
		let upperRightPathOne = this.calculateOrderScore(this.unfoldBoardVertical(true, false), rVal);
		let upperRightPathTwo = this.calculateOrderScore(this.unfoldBoardHorizontal(false, true), rVal);
		let lowerLeftPathOne = this.calculateOrderScore(this.unfoldBoardVertical(true, true), rVal);
		let lowerLeftPathTwo = this.calculateOrderScore(this.unfoldBoardHorizontal(true, false), rVal);
		let lowerRightPathOne = this.calculateOrderScore(this.unfoldBoardVertical(true, true), rVal);
		let lowerRightPathTwo = this.calculateOrderScore(this.unfoldBoardHorizontal(true, true), rVal);
		
		return Math.max(upperLeftPathOne, upperLeftPathTwo, upperRightPathOne, upperRightPathTwo, lowerLeftPathOne, lowerLeftPathTwo, lowerRightPathOne, lowerRightPathTwo);
	}
	
	calculateMoveScore(evaluationSettings)
	{
		return (this.scoreDifference * evaluationSettings.scoreWeight) + 
		(this.numEmptyTiles * evaluationSettings.emptyTileWeight) + 
		(this.calculateMonotonicity(evaluationSettings.monotonicityRVal) * evaluationSettings.monotonicityWeight) - 
		(this.calculateRoughnessPenalty() * evaluationSettings.roughnessPenaltyWeight);
	}
	
}

function generateFutureStates(curBoard, evaluationSettings)
{
	let boardPossibilities = [];
	
	for(let i = 0; i < Direction.TOTAL; i++)
	{
		boardPossibilities.push(new BoardPossibility(curBoard, i, evaluationSettings));
	}
	
	return boardPossibilities;
}

function evaluatePossibilityPotential(boardPossibility, depth, evaluationSettings)
{
	if(depth <= 0 || !boardPossibility.isValidMove)
	{
		return boardPossibility.moveScore;
	}
	
	let futurePossibilities = generateFutureStates(boardPossibility.gameBoard, evaluationSettings);
	
	return boardPossibility.moveScore + 
			Math.max(evaluatePossibilityPotential(futurePossibilities[Direction.UP], depth - 1, evaluationSettings),
					evaluatePossibilityPotential(futurePossibilities[Direction.DOWN], depth - 1, evaluationSettings),
					evaluatePossibilityPotential(futurePossibilities[Direction.LEFT], depth - 1, evaluationSettings),
					evaluatePossibilityPotential(futurePossibilities[Direction.RIGHT], depth - 1, evaluationSettings));
}

// Evaluate move score based on different ways the tile could spawn after each move
function evaluateWeightedMoveScores(curBoard, numIter, depth, evaluationSettings)
{
	let moveDatas = [
		new MoveData(Direction.UP),
		new MoveData(Direction.DOWN),
		new MoveData(Direction.LEFT),
		new MoveData(Direction.RIGHT)
	];
	
	for(let i = 0; i < numIter; i++)
	{
		let futureStates = generateFutureStates(curBoard, evaluationSettings);
		
		for(let j = 0; j < futureStates.length; j++)
		{
			if(futureStates[j].isValidMove)
			{
				moveDatas[j].score += evaluatePossibilityPotential(futureStates[j], depth, evaluationSettings);
				moveDatas[j].isValidMove = true;
			}
		}
	}
	
	for(let i = 0; i < moveDatas.length; i++)
	{
		moveDatas[i].score /= numIter;
	}
	
	return moveDatas;
}

function moveToDirection(curBoard, direction)
{
	if(direction == Direction.UP)
	{
		curBoard.moveUp();
	}
	else if(direction == Direction.DOWN)
	{
		curBoard.moveDown();
	}
	else if(direction == Direction.LEFT)
	{
		curBoard.moveLeft();
	}
	else if(direction == Direction.RIGHT)
	{
		curBoard.moveRight();
	}
}

function makeBestMove(curBoard, numIter, depth, evaluationSettings)
{
	let moveDatas = evaluateWeightedMoveScores(curBoard, numIter, depth, evaluationSettings);
	let bestMove = new MoveData(Direction.NONE);
	
	// Select first valid move data
	
	let init = 0;
	
	while(init < moveDatas.length && !moveDatas[init].isValidMove)
	{
		init++;
	}
	
	bestMove = moveDatas[init];
	
	for(let i = init + 1; i < moveDatas.length; i++)
	{
		if(moveDatas[i].isValidMove && moveDatas[i].score > bestMove.score)
		{
			bestMove = moveDatas[i];
		}
	}
	
	moveToDirection(curBoard, bestMove.direction)
}