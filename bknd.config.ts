import { boolean, em, entity, enumm, number, text } from 'bknd'
import { type BunBkndConfig, registerLocalMediaAdapter, writer } from 'bknd/adapter/bun'
import { sqlite } from 'bknd/adapter/sqlite'
import { code } from 'bknd/modes'
import { timestamps } from 'bknd/plugins'
import { secureRandomString } from 'bknd/utils'

const local = registerLocalMediaAdapter()

const schema = em(
  {
    profiles: entity('profiles', {
      name: text().required(),
      bio: text(),
      avatar: text(),
      user_id: text().required(),
    }),
    groups: entity('groups', {
      name: text().required(),
      description: text(),
      visibility: enumm({ enum: ['public', 'private'] }).required(),
      icon: text(),
    }),
    memberships: entity('memberships', {
      role: enumm({ enum: ['admin', 'member'] }).required(),
    }),
    discussions: entity('discussions', {
      title: text().required(),
      body: text().required(),
      edited: boolean({ default_value: false }),
    }),
    replies: entity('replies', {
      body: text().required(),
      edited: boolean({ default_value: false }),
    }),
    attachments: entity('attachments', {
      url: text().required(),
      filename: text().required(),
      size: number(),
      mime_type: text(),
    }),
    invites: entity('invites', {
      code: text().required(),
      expires_at: text(),
    }),
    reports: entity('reports', {
      reason: text().required(),
      resolved: boolean({ default_value: false }),
    }),
  },
  ({ relation, index }, { profiles, groups, memberships, discussions, replies, attachments, invites, reports }) => {
    // Memberships: profile + group
    relation(memberships).manyToOne(profiles)
    relation(memberships).manyToOne(groups)

    // Discussions: author (profile) + group
    relation(discussions).manyToOne(profiles)
    relation(discussions).manyToOne(groups)

    // Replies: author (profile) + discussion
    relation(replies).manyToOne(profiles)
    relation(replies).manyToOne(discussions)

    // Attachments: uploader (profile) + discussion + reply
    relation(attachments).manyToOne(profiles)
    relation(attachments).manyToOne(discussions)
    relation(attachments).manyToOne(replies)

    // Invites: created by (profile) + group
    relation(invites).manyToOne(profiles)
    relation(invites).manyToOne(groups)

    // Reports: reporter (profile) + discussion + reply
    relation(reports).manyToOne(profiles)
    relation(reports).manyToOne(discussions)
    relation(reports).manyToOne(replies)

    // Indices
    index(profiles).on(['user_id'], true)
    index(invites).on(['code'], true)
  }
)

type Database = (typeof schema)['DB']
declare module 'bknd' {
  interface DB extends Database {}
}

const config = code<BunBkndConfig>({
  connection: sqlite({ url: 'file:data.db' }),
  config: {
    media: {
      enabled: true,
      adapter: local({
        path: './public/uploads',
      }),
    },
    data: schema.toJSON(),
    auth: {
      allow_register: true,
      enabled: true,
      cookie: {
        pathSuccess: '/admin',
      },
      jwt: {
        issuer: 'cultivate',
        secret: secureRandomString(64),
      },
      guard: {
        enabled: !!(process.env.BKND_SEED_ADMIN_USERNAME && process.env.BKND_SEED_ADMIN_PASSWORD),
      },
      roles: {
        admin: {
          implicit_allow: true,
        },
        default: {
          permissions: ['system.access.api', 'data.database.sync', 'data.entity.read', 'media.file.read', 'media.file.list'],
          is_default: true,
        },
      },
    },
  },
  options: {
    plugins: [
      timestamps({
        entities: ['profiles', 'groups', 'memberships', 'discussions', 'replies', 'attachments', 'invites', 'reports'],
        setUpdatedOnCreate: true,
      }),
    ],
    seed: async (ctx) => {
      if (process.env.BKND_SEED_ADMIN_USERNAME && process.env.BKND_SEED_ADMIN_PASSWORD) {
        await ctx.app.module.auth.createUser({
          email: process.env.BKND_SEED_ADMIN_USERNAME,
          password: process.env.BKND_SEED_ADMIN_PASSWORD,
          role: 'admin',
        })
      }

      const profile = await ctx.em.mutator('profiles').insertOne({
        name: 'Demo User',
        bio: 'Just a person who likes calm conversations.',
        user_id: 'seed-user',
      })

      const group = await ctx.em.mutator('groups').insertOne({
        name: 'The Front Porch',
        description: 'A place for unhurried conversation. Grab a seat, stay a while.',
        visibility: 'public',
      })

      await ctx.em.mutator('memberships').insertOne({
        role: 'admin',
        profile_id: profile.data?.id,
        group_id: group.data?.id,
      } as any)

      const discussion1 = await ctx.em.mutator('discussions').insertOne({
        title: 'What book changed how you think?',
        body: "I just finished re-reading *Designing Data-Intensive Applications* for the third time. Every read surfaces something new.\n\nWhat's a book that genuinely shifted your perspective — on technology, life, anything?",
        profile_id: profile.data?.id,
        group_id: group.data?.id,
      } as any)

      const discussion2 = await ctx.em.mutator('discussions').insertOne({
        title: 'The case for building slower',
        body: "We optimize for speed constantly — fast deploys, fast iterations, fast feedback loops. But some of the best things I've built came from slowing down.\n\nAnyone else find that the best work happens when you resist the urge to ship immediately?",
        profile_id: profile.data?.id,
        group_id: group.data?.id,
      } as any)

      await ctx.em.mutator('replies').insertMany([
        {
          body: 'For me it was *Sapiens* by Yuval Noah Harari. Completely reframed how I think about the stories we tell ourselves as a society.',
          profile_id: profile.data?.id,
          discussion_id: discussion1.data?.id,
        },
        {
          body: 'I keep coming back to *The Pragmatic Programmer*. Not flashy, but it shaped how I approach problems daily.',
          profile_id: profile.data?.id,
          discussion_id: discussion1.data?.id,
        },
        {
          body: 'Totally agree. I once spent a whole weekend just *thinking* about an architecture before writing a line of code. It was the cleanest system I ever built.',
          profile_id: profile.data?.id,
          discussion_id: discussion2.data?.id,
        },
      ] as any)

      await ctx.em.mutator('invites').insertOne({
        code: 'welcome-to-the-porch',
        profile_id: profile.data?.id,
        group_id: group.data?.id,
      } as any)
    },
  },
  writer,
  typesFilePath: 'bknd-types.d.ts',
  isProduction: process.env?.PROD === 'true',
  syncSchema: {
    force: true,
    drop: true,
  },
  adminOptions: {
    adminBasepath: '/admin',
    logoReturnPath: '/../',
  },
})

export default config
