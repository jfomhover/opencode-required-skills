import { readHistory } from "./history.js"

type State = { epoch: number; restored: boolean; skills: Set<string>; restore?: Promise<void> }
export class SessionState {
  private readonly states = new Map<string, State>()
  private state(id: string): State { let value = this.states.get(id); if (!value) { value = { epoch: 0, restored: false, skills: new Set() }; this.states.set(id, value) } return value }
  async restore(id: string, client: any): Promise<Set<string>> {
    const state = this.state(id); if (state.restored) return state.skills
    if (!state.restore) {
      const epoch = state.epoch
      state.restore = readHistory(client, id).then((events) => { if (state.epoch !== epoch) return; state.skills.clear(); for (const event of events) event.type === "compaction" ? state.skills.clear() : state.skills.add(event.name); state.restored = true }).finally(() => { state.restore = undefined })
    }
    await state.restore; return state.skills
  }
  complete(id: string, skill: string) { this.state(id).skills.add(skill) }
  compact(id: string) { const state = this.state(id); state.epoch++; state.restored = true; state.skills.clear() }
  delete(id: string) { this.states.delete(id) }
}
