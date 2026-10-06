/**
 * Maps backend agent names and step strings to user-facing pipeline stages.
 * Backend agents: patch_builder, extractor, index_keeper, note_author, reviewer, diagram_agent, formatter, next_topic
 */

export const PIPELINE_STAGES = [
  {
    key: 'read',
    label: 'Read',
    agents: ['patch_builder'],
    description: 'Reading your conversation',
  },
  {
    key: 'extract',
    label: 'Extract',
    agents: ['extractor'],
    description: 'Pulling out topics and facts',
  },
  {
    key: 'organise',
    label: 'Organise',
    agents: ['index_keeper'],
    description: 'Matching facts to topics',
  },
  {
    key: 'write',
    label: 'Write notes',
    agents: ['note_author', 'reviewer', 'diagram_agent', 'formatter', 'next_topic'],
    description: 'Writing and reviewing notes',
  },
  {
    key: 'finish',
    label: 'Finish',
    agents: [],
    description: 'Done',
  },
]

export function agentToStage(currentAgent) {
  if (!currentAgent) return null
  const lower = currentAgent.toLowerCase()
  for (const stage of PIPELINE_STAGES) {
    if (stage.agents.some(a => lower.includes(a))) {
      return stage.key
    }
  }
  return null
}

export function getStageStatus(stageKey, currentAgent, percentage, sourceStatus) {
  const stageIndex = PIPELINE_STAGES.findIndex(s => s.key === stageKey)
  const currentStageKey = agentToStage(currentAgent)
  const currentStageIndex = PIPELINE_STAGES.findIndex(s => s.key === currentStageKey)

  if (sourceStatus === 'completed') {
    return stageKey === 'finish' ? 'done' : 'done'
  }

  if (sourceStatus === 'failed') {
    if (stageIndex < currentStageIndex) return 'done'
    if (stageIndex === currentStageIndex) return 'failed'
    return 'waiting'
  }

  if (stageIndex < currentStageIndex) return 'done'
  if (stageIndex === currentStageIndex) return 'active'
  if (stageKey === 'finish' && percentage >= 95) return 'active'
  return 'waiting'
}

export function humanizeAgent(agentName) {
  if (!agentName) return ''
  const map = {
    patch_builder: 'Reading conversation',
    extractor: 'Extracting facts and topics',
    index_keeper: 'Organising into topics',
    note_author: 'Writing note',
    reviewer: 'Reviewing note',
    diagram_agent: 'Adding diagrams',
    formatter: 'Saving note',
    next_topic: 'Moving to next topic',
  }
  const lower = agentName.toLowerCase()
  for (const [key, label] of Object.entries(map)) {
    if (lower.includes(key)) return label
  }
  return agentName
}
