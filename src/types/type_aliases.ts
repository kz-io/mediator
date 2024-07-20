/**
 * @copyright 2020-2024 integereleven. All rights reserved. MIT license.
 * @file Type aliases for the module. For interfaces, see ./interfaces.ts.
 */

import type { IndeterminateObject } from '@kz/common-types';
import type { PubSubTopicMessage } from '@kz/pubsub';

/**
 * Represents a topical message published from participants to a mediator.
 *
 * @typeParam T - The topics-to-type map of the types being observed.
 * @typeParam K - The topic this message is published to.
 *
 * @example
 * ```ts
 * import type { MediatorTopicMessage } from './type_aliases.ts';
 *
 * type MyTopics = {
 *   TopicA: string;
 *   TopicB: { value: number };
 *   TopicC: { timestamp: Date };
 * };
 *
 * const message: MediatorTopicMessage<MyTopics, 'TopicA'> = [Symbol('myParticipant'), 'TopicA', 'Hello, world!'];
 * ```
 */
export type MediatorTopicMessage<
  T extends IndeterminateObject = IndeterminateObject,
  K extends keyof T = keyof T,
> = [symbol, K, T[K]];

/**
 * Represents a topical message published from a mediator to participants.
 *
 * @typeParam T - The topics-to-type map of the types being observed.
 * @typeParam K - The topic this message is published to.
 */
export type ParticipantTopicMessage<
  T extends IndeterminateObject = IndeterminateObject,
  K extends keyof T = keyof T,
> = PubSubTopicMessage<T, K>;
