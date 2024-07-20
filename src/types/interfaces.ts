/**
 * @copyright 2020-2024 integereleven. All rights reserved. MIT license.
 * @file Interfaces for the module. For type aliases, see ./type_aliases.ts.
 */

import { TBaseMediator } from '../mod.ts';

import type { IDisposable } from '@kz/dispose';
import type { PubSubTopics, TSubscriber } from '@kz/pubsub';
import type { ParticipantTopicMessage } from './type_aliases.ts';

/**
 * Provides a mechanism to receive topical notifications from a {@link Mediator} instance.
 *
 * @typeParam T - The topics-to-type map of the types being observed.
 * @typeParam K - The topics this subscriber supports.
 */
export interface TParticipant<T extends PubSubTopics, K extends keyof T>
  extends TSubscriber<PubSubTopics<Pick<T, K>>, K> {
  /**
   * The topics this subscriber is subscribed to.
   */
  readonly topics: K[];

  /**
   * The unique identifier for this participant.
   */
  readonly participantId: symbol;

  /**
   * Publishes a message to the mediator.
   *
   * @param message - The message to publish.
   */
  publish(message: ParticipantTopicMessage<T>): void;

  /**
   * Subscribes the participant to a mediator.
   *
   * @param mediator - The mediator to subscribe to.
   *
   * @returns A disposable that can be used to unsubscribe the participant from the mediator.
   */
  subscribe(mediator: TBaseMediator<PubSubTopics<T>>): IDisposable;
}
