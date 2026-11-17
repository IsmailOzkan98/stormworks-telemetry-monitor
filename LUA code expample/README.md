
# [SYSTEM NAME]
# MC [XX]: [MODULE NAME]
# VERSION: [MODULE VERSION]

## RESPONSIBILITY:
- [DESCRIBE THE MAIN FUNCTION OF THE MODULE]
- [DESCRIBE WHICH SYSTEMS IT CONTROLS]
- [DESCRIBE WHICH DATA IT PROCESSES]
- [DESCRIBE WHICH OUTPUTS IT GENERATES]

---

## 01. INPUT CONFIGURATION

### NUMERIC INPUTS
Enter numeric channels here.

Format: `NAME = CHANNEL_NUMBER`

```lua
INPUT_01 = 1,
INPUT_02 = 2,
INPUT_03 = 3,
```

### BOOLEAN INPUTS
Enter boolean channels here.

Format: `NAME = CHANNEL_NUMBER`

```lua
BOOL_01 = 1,
BOOL_02 = 2,
BOOL_03 = 3,
```

### RX-TX / COMMUNICATION INPUTS
Add communication inputs here if required.

```lua
-- RX_TX_STATE = 19,
-- RX_TX_INPUT = 20
```

---

## 02. SYSTEM CONFIGURATION

```lua
local CONFIG = {

    -- Enable or disable the module.
    ENABLED = true,

    -- Communication configuration.
    PORT = 8080,

    -- Execution or transmission interval.
    -- Expressed in onTick() cycles.
    INTERVAL = 6,

    -- Internal counter.
    -- Do not modify under normal circumstances.
    tick = 0

}
```

---

## 03. SYSTEM DEFINITIONS

Define states, stages or modes here.

The number corresponds to the received state.

```lua
local DEFINITIONS = {

    [1] = "STAGE_01",
    [2] = "STAGE_02",
    [3] = "STAGE_03",
    [4] = "STAGE_04",
    [5] = "STAGE_05",

}
```

---

## 04. MAIN SYSTEM FUNCTION

### SYSTEM ENABLE CHECK
Check whether the module is enabled.

### EXECUTION INTERVAL
Control the execution frequency.

### SYSTEM STATE
Get the current system state.

```lua
local currentStage =
    DEFINITIONS[data.state] or "STANDBY"
```

### SYSTEM STATUS
Define the overall system status.

Examples:
- IDLE
- RUNNING
- COMPLETED
- ERROR

### SYSTEM CALCULATIONS
Insert internal calculations.

Examples:
- Errors between actual and target values.
- Distances.
- Speeds.
- Angles.
- Percentages.
- Unit conversions.

### SYSTEM CONDITIONS
Insert operating conditions.

Examples:
- Safety checks.
- Operating limits.
- System activation.
- Error detection.
- Completion conditions.

### OUTPUT GENERATION
Insert module outputs.

Examples:
- `output.setNumber()`
- `output.setBool()`
- Activation of other systems.

### COMMUNICATION / DATA TRANSMISSION
Insert communication with other modules.

Examples:
- `async.httpGet()`
- Data transmission.
- Status transmission.
- Inter-system communication.

---

## 05. MAIN TICK

### READ NUMERIC INPUTS
Read all numeric inputs.

```lua
local data = {

    input01 = input.getNumber(INPUT.INPUT_01),
    input02 = input.getNumber(INPUT.INPUT_02),
    input03 = input.getNumber(INPUT.INPUT_03)

}
```

### READ BOOLEAN INPUTS
Read boolean inputs.

```lua
data.bool01 = input.getBool(INPUT.BOOL_01)
data.bool02 = input.getBool(INPUT.BOOL_02)
data.bool03 = input.getBool(INPUT.BOOL_03)
```

### READ ADDITIONAL INPUTS
Add additional inputs if required.

Examples:
- Communication data.
- External signals.
- Additional sensors.

### EXECUTE MAIN SYSTEM

```lua
processSystem(data)
```

---

## 06. ADDITIONAL FUNCTIONS

Add helper functions here if required.

Examples:

```lua
-- local function calculateValue()
-- local function checkConditions()
-- local function convertUnits()
```

---

**END OF MC [XX]**
