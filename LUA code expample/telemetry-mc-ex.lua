--------------------------------------------------
-- STORMWORKS - MIZUSHIMA TELEMETRY
-- VERSION: 1.1
--
-- PURPOSE:
-- Send vehicle telemetry to Mizushima YR-02
--------------------------------------------------


--------------------------------------------------
-- 01. CONFIGURATION
--------------------------------------------------

local TELEMETRY = {

    ENABLED = true,

    PORT = 8080,

    INTERVAL = 6,

    STAGE = "WAITING",

    STATUS = "IDLE",

    tick = 0

}


--------------------------------------------------
-- 02. INPUT CONFIGURATION
--------------------------------------------------

-- Stormworks numeric input channels.
-- Configure these channels in your microcontroller.

local INPUT = {

    STATE = 1,
    TIMER = 2,

    ALT = 3,
    ALT_TARGET = 4,

    VS = 5,
    VS_TARGET = 6,

    RPS = 7,
    RPS_TARGET = 8,

    ROLL = 9,
    PITCH = 10,

    AP = 11,
    AP_DISTANCE = 12,
    YAW = 13,

    MY_X = 14,
    MY_Y = 15,

    TARGET_X = 16,
    TARGET_Y = 17,

    MAIN = 18,
    ALT_HOLD = 19,
    ROLL_STAB = 20,
    ACCEL = 21,
    DESCENT = 22,

    NORTH = 23,
    EAST = 24,
    SOUTH = 25,
    WEST = 26,

    AFTERBURNER = 27,
    SPOILER = 28,
    ABSOLUTE_SPEED = 29,

    RX_TX_STATE = 30,
    RX_TX_FREQUENCY_TX = 31,
    RX_TX_FREQUENCY_RX = 32

}


--------------------------------------------------
-- 03. TELEMETRY DATA
--------------------------------------------------

local function readTelemetry()

    local data = {

        state = input.getNumber(INPUT.STATE),
        timer = input.getNumber(INPUT.TIMER),

        alt = input.getNumber(INPUT.ALT),
        alt_target = input.getNumber(INPUT.ALT_TARGET),

        vs = input.getNumber(INPUT.VS),
        vs_target = input.getNumber(INPUT.VS_TARGET),

        rps = input.getNumber(INPUT.RPS),
        rps_target = input.getNumber(INPUT.RPS_TARGET),

        roll = input.getNumber(INPUT.ROLL),
        pitch = input.getNumber(INPUT.PITCH),

        ap = input.getNumber(INPUT.AP),
        ap_distance = input.getNumber(INPUT.AP_DISTANCE),
        yaw = input.getNumber(INPUT.YAW),

        my_x = input.getNumber(INPUT.MY_X),
        my_y = input.getNumber(INPUT.MY_Y),

        target_x = input.getNumber(INPUT.TARGET_X),
        target_y = input.getNumber(INPUT.TARGET_Y),

        main = input.getNumber(INPUT.MAIN),
        alt_hold = input.getNumber(INPUT.ALT_HOLD),
        roll_stab = input.getNumber(INPUT.ROLL_STAB),
        accel = input.getNumber(INPUT.ACCEL),
        descent = input.getNumber(INPUT.DESCENT),

        north = input.getNumber(INPUT.NORTH),
        east = input.getNumber(INPUT.EAST),
        south = input.getNumber(INPUT.SOUTH),
        west = input.getNumber(INPUT.WEST),

        afterburner = input.getNumber(INPUT.AFTERBURNER),
        spoiler = input.getNumber(INPUT.SPOILER),
        absolute_speed = input.getNumber(INPUT.ABSOLUTE_SPEED),

        rx_tx_state = input.getNumber(INPUT.RX_TX_STATE),
        rx_tx_frequency_tx = input.getNumber(INPUT.RX_TX_FREQUENCY_TX),
        rx_tx_frequency_rx = input.getNumber(INPUT.RX_TX_FREQUENCY_RX)

    }

    -- Calculate telemetry errors

    data.alt_error = data.alt_target - data.alt
    data.vs_error = data.vs_target - data.vs

    return data

end


--------------------------------------------------
-- 04. HTTP TRANSMISSION
--------------------------------------------------

local function sendTelemetry(data)

    if not TELEMETRY.ENABLED then
        return
    end

    -- Transmission interval

    TELEMETRY.tick = TELEMETRY.tick + 1

    if TELEMETRY.tick < TELEMETRY.INTERVAL then
        return
    end

    TELEMETRY.tick = 0


    -- Build HTTP request

    local url = string.format(

        "/telemetry?"
        .. "stage=%s"
        .. "&state=%.2f"
        .. "&status=%s"
        .. "&timer=%.2f"

        .. "&alt=%.2f"
        .. "&alt_target=%.2f"
        .. "&alt_error=%.2f"

        .. "&vs=%.2f"
        .. "&vs_target=%.2f"
        .. "&vs_error=%.2f"

        .. "&rps=%.2f"
        .. "&rps_target=%.2f"

        .. "&roll=%.2f"
        .. "&pitch=%.2f"

        .. "&ap=%.2f"
        .. "&ap_distance=%.2f"
        .. "&yaw=%.2f"

        .. "&my_x=%.2f"
        .. "&my_y=%.2f"
        .. "&target_x=%.2f"
        .. "&target_y=%.2f"

        .. "&main=%.2f"
        .. "&alt_hold=%.2f"
        .. "&roll_stab=%.2f"
        .. "&accel=%.2f"
        .. "&descent=%.2f"

        .. "&north=%.2f"
        .. "&east=%.2f"
        .. "&south=%.2f"
        .. "&west=%.2f"

        .. "&afterburner=%.2f"
        .. "&spoiler=%.2f"
        .. "&absolute_speed=%.2f"

        .. "&rx_tx_state=%.2f"
        .. "&rx_tx_frequency_tx=%.2f"
        .. "&rx_tx_frequency_rx=%.2f",

        TELEMETRY.STAGE,

        data.state,
        TELEMETRY.STATUS,
        data.timer,

        data.alt,
        data.alt_target,
        data.alt_error,

        data.vs,
        data.vs_target,
        data.vs_error,

        data.rps,
        data.rps_target,

        data.roll,
        data.pitch,

        data.ap,
        data.ap_distance,
        data.yaw,

        data.my_x,
        data.my_y,
        data.target_x,
        data.target_y,

        data.main,
        data.alt_hold,
        data.roll_stab,
        data.accel,
        data.descent,

        data.north,
        data.east,
        data.south,
        data.west,

        data.afterburner,
        data.spoiler,
        data.absolute_speed,

        data.rx_tx_state,
        data.rx_tx_frequency_tx,
        data.rx_tx_frequency_rx

    )


    -- Send telemetry to Mizushima

    async.httpGet(

        TELEMETRY.PORT,

        url

    )

end


--------------------------------------------------
-- 05. MAIN TICK
--------------------------------------------------

function onTick()

    local data = readTelemetry()

    sendTelemetry(data)

end


--------------------------------------------------
-- END OF MIZUSHIMA TELEMETRY
--------------------------------------------------