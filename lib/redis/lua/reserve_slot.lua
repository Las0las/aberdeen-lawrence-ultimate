-- KEYS[1] = slot key "slot:{slotId}"
-- KEYS[2] = alternatives key "alt:{slotId}"  
-- ARGV[1] = candidateId
-- ARGV[2] = ttlSeconds
-- ARGV[3] = alternatives JSON array

local slotKey = KEYS[1]
local altKey = KEYS[2]
local candidateId = ARGV[1]
local ttl = tonumber(ARGV[2])
local alternatives = ARGV[3]

-- Check if slot is available
if redis.call('EXISTS', slotKey) == 0 then
  -- Reserve the slot
  redis.call('SET', slotKey, candidateId, 'EX', ttl)
  return {'success', 'reserved'}
else
  -- Slot taken, check alternatives
  local currentReserver = redis.call('GET', slotKey)
  
  -- Store alternatives for conflict resolution
  if alternatives and alternatives ~= '' then
    redis.call('SET', altKey, alternatives, 'EX', 300) -- 5 min TTL
  end
  
  return {'conflict', currentReserver}
end
