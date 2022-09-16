import { Notification } from '../notification'
import { SessionID } from '../sessionID'
import { message_id } from '../messageID'
import { method } from '../method'
import { JSONValue } from '../../json'
import * as boostpow from 'boostpow'

export type notify_params = [string, string, string, string, string[], string, string, string, boolean]

export class NotifyParams {

  static valid(params: notify_params): boolean {
    let is_hex = function(hex) {
      return typeof hex === 'string' && /^(([0-9a-f][0-9a-f])*)|(([0-9A-F][0-9A-F])*)$/.test(hex)
    }

    if (!(is_hex(params[1]) && params[1].length == 64 &&
      is_hex(params[2]) && is_hex(params[3]) && Array.isArray(params[4]) &&
      SessionID.valid(params[5]) && SessionID.valid(params[6]) &&
      SessionID.valid(params[7]) && typeof params[8] === 'boolean')) {
      return false
    }

    for (let digest of params[4]) {
      if (!(is_hex(digest) && digest.length === 64)) {
        console.log("invalid notify params y")
        return false
      }
    }

    return true
  }

  static jobID(p: notify_params): string {
    if (this.valid(p)) {
      return p[0]
    }

    throw "invalid notify"
  }

  static prevHash(p: notify_params): boostpow.Digest32 {
    if (this.valid(p)) {
      let digest = boostpow.Digest32.fromHex(p[1])
      digest.buffer.reverse()
      return digest
    }

    throw "invalid notify"
  }

  static generationTX1(p: notify_params): boostpow.Bytes {
    if (this.valid(p)) {
      return new boostpow.Bytes(Buffer.from(p[2], 'hex'))
    }

    throw "invalid notify"
  }

  static generationTX2(p: notify_params): boostpow.Bytes {
    if (this.valid(p)) {
      return new boostpow.Bytes(Buffer.from(p[3], 'hex'))
    }

    throw "invalid notify"
  }

  static merkleBranch(p: notify_params): boostpow.Digest32[] {
    if (!this.valid(p)) throw "invalid notify"

    let path_hex: string[] = p[4]

    let path: boostpow.Digest32[] = []
    for (let d of path_hex) {
      path.push(boostpow.Digest32.fromHex(d))
    }

    return path
  }

  static version(p: notify_params): boostpow.Int32Little {
    if (this.valid(p)) {
      return boostpow.Int32Little.fromHex(p[5])
    }

    throw "invalid notify"
  }

  static nbits(p: notify_params): boostpow.Difficulty {
    if (this.valid(p)) {
      return boostpow.Difficulty.fromBits(boostpow.UInt32Little.fromHex(p[6]).number)
    }

    throw "invalid notify"
  }

  static time(p: notify_params): boostpow.UInt32Little {
    if (this.valid(p)) {
      return boostpow.UInt32Little.fromHex(p[7])
    }

    throw "invalid notify"
  }

  static clean(p: notify_params): boolean {
    if (this.valid(p)) return p[8]

    throw "invalid notify"
  }

  static make(
    job_id: string,
    prev_hash: boostpow.Digest32,
    gtx1: boostpow.Bytes,
    gtx2: boostpow.Bytes,
    branch: boostpow.Digest32[],
    version: boostpow.Int32Little,
    bits: boostpow.Difficulty,
    time: boostpow.UInt32Little,
    clean: boolean): notify_params {

    let path: string[] = []
    for (let d of branch) {
      path.push(d.hex)
    }

    return [job_id, prev_hash.buffer.toString('hex'), gtx1.hex, gtx2.hex, path, version.hex, bits.hex, time.hex, clean]
  }

}

export type notify = {
  id: null,
  method: method,
  params: notify_params
}

export class Notify extends Notification {

  static valid(message: notify): boolean {
    let n = Notification.read(message)
    if (!n || n['method'] !== "mining.notify") return false

    return NotifyParams.valid(n['params'])
  }

  static read(message: JSONValue): notify | undefined {
    let n = Notification.read(message)
    if (!n || n['method'] !== "mining.notify" || n.params.length != 9 ||
      typeof n.params[0] !== 'string' || typeof n.params[1] !== 'string' ||
      typeof n.params[2] !== 'string' || typeof n.params[3] !== 'string' ||
      !Array.isArray(n.params[4]) || typeof n.params[5] !== 'string' ||
      typeof n.params[6] !== 'string' || typeof n.params[7] !== 'string' ||
      typeof n.params[8] !== 'boolean') return

    for (let x of n.params[4]) if (typeof x !== 'string') return

    if (NotifyParams.valid(n['params'])) return <notify>n
  }

  static make(
    job_id: string,
    prev_hash: boostpow.Digest32,
    gtx1: boostpow.Bytes,
    gtx2: boostpow.Bytes,
    branch: boostpow.Digest32[],
    version: boostpow.Int32Little,
    bits: boostpow.Difficulty,
    time: boostpow.UInt32Little,
    clean: boolean): notify {

    return {id: null, method: 'mining.notify',
      params: NotifyParams.make(job_id, prev_hash, gtx1, gtx2, branch, version, bits, time, clean)}
  }

}
