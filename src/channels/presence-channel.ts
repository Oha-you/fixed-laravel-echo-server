import { Database } from './../database'
import { Log } from './../log'
const _ = require("lodash")

export class PresenceChannel {
  /**
   * Database instance.
   */
  db: Database

  /**
   * Pending member updates per channel. Joins and leaves read, change and
   * write the whole member list, so they run one at a time per channel.
   */
  private queues: { [channel: string]: Promise<any> } = {}

  /**
   * Create a new Presence channel instance.
   */
  constructor(private io, private options: any) {
    this.db = new Database(options)
  }

  /**
   * Get the members of a presence channel.
   */
  getMembers(channel: string): Promise<any[]> {
    return this.db.get(channel + ":members").then((members) => members || [])
  }

  /**
   * Check if a user is on a presence channel.
   */
  isMember(members: any[], member: any): boolean {
    return members.some((m: { user_id: any }) => m.user_id == member.user_id)
  }

  /**
   * Remove inactive channel members from the presence channel.
   */
  removeInactive(channel: string, members: any[]): Promise<any[]> {
    return this.io.of("/").in(channel).fetchSockets().then((clients) => {
      members = members.filter((member) => clients.find((client) => client.id == member.socketId) != null)

      this.db.set(channel + ":members", members)

      return members
    })
  }

  /**
   * Run a member update after the pending ones on the same channel.
   */
  queue(channel: string, task: () => Promise<any>): Promise<any> {
    const previous = this.queues[channel] || Promise.resolve()
    const next = previous.then(task).catch((error) => {
      Log.error(`Presence channel ${channel}: ${error && error.stack ? error.stack : error}`)
    })

    this.queues[channel] = next
    next.then(() => {
      if (this.queues[channel] === next)
        delete this.queues[channel]
    })

    return next
  }

  /**
   * Join a presence channel and emit that they have joined only if it is the
   * first instance of their presence.
   */
  join(socket: any, channel: string, member: any): Promise<any> {
    if (!member) {
      if (this.options.devMode)
        Log.error(
          "Unable to join channel. Member data for presence channel missing"
        )

      return Promise.resolve()
    }

    Log.info(`${socket.id} - ${member.user_id} - Joining to presence channel ${channel}`, true)

    return this.queue(channel, () =>
      this.getMembers(channel)
        .then((members) => this.removeInactive(channel, members))
        .then((members) => {
          if (!socket.connected)
            return

          const is_member = this.isMember(members, member)

          member.socketId = socket.id
          members = members.filter((m) => m.socketId != socket.id)
          members.push(member)

          this.db.set(channel + ":members", members)

          this.onSubscribed(socket, channel, _.uniqBy(members.slice().reverse(), "user_id"))

          if (!is_member)
            this.onJoin(socket, channel, member)
        })
    )
  }

  /**
   * Remove a member from a presenece channel and broadcast they have left
   * only if not other presence channel instances exist.
   */
  leave(socket: any, channel: string): Promise<any> {
    return this.queue(channel, () =>
      this.getMembers(channel).then((members) => {
        const member = members.find((m) => m.socketId == socket.id)

        // Not a member: the join never finished, failed auth or was already removed.
        if (!member)
          return

        members = members.filter((m) => m.socketId != socket.id)

        return this.removeInactive(channel, members).then((members) => {
          if (!this.isMember(members, member)) {
            delete member.socketId
            this.onLeave(channel, member)
          }
        })
      })
    )
  }

  /**
   * On join event handler.
   */
  onJoin(socket: any, channel: string, member: any): void {
    this.options.echoServer.broadcast(channel, {
      socket: socket.id,
      event: "presence:joining",
      data: member,
    })
  }

  /**
   * On leave emitter.
   */
  onLeave(channel: string, member: any): void {
    this.options.echoServer.broadcast(channel, {
      event: "presence:leaving",
      data: member,
    })
  }

  /**
   * On subscribed event emitter.
   */
  onSubscribed(socket: any, channel: string, members: any[]) {
    this.io.to(socket.id).emit("presence:subscribed", channel, members)
  }
}
