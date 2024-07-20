/**
 * @copyright 2020-2024 integereleven. All rights reserved. MIT license.
 * @file Exports the TAbstractParticipant abstract class.
 */

import { TAbstractObserver, TSubscription } from '@kz/observe';
import { TBaseMediator } from './t_base_mediator.ts';

import type { IDisposable } from '@kz/dispose';
import type { PubSubTopics } from '@kz/pubsub';
import type { ParticipantTopicMessage, TParticipant } from './types/mod.ts';

/**
 * Provides an abstract implementation for a participant that can receive from and publish to, topical notifications of a mediator.
 *
 * @typeParam T - The topics-to-type map of the types being observed.
 * @typeParam K - The topics this subscriber supports.
 *
 * @example
 * ```ts
 * import { TAbstractParticipant } from './t_abstract_participant.ts';
 *
 * import type { ParticipantTopicMessage } from './types/mod.ts';
 *
 * type MyTopics = {
 *   TopicA: string;
 *   TopicB: { value: number };
 *   TopicC: { timestamp: Date };
 * };
 *
 * class MyParticipant extends TAbstractParticipant<MyTopics> {
 *   next(value: ParticipantTopicMessage<MyTopics>): void {
 *     const [topic, message] = value;
 *
 *     if (topic === 'TopicA') {
 *       console.log(message);
 *     } else if (topic === 'TopicB') {
 *       console.log(`Took ${(message as MyTopics["TopicB"]).value} seconds to complete.`);
 *     } else {
 *        console.log(`Completed at ${(message as MyTopics["TopicC"]).timestamp}.`);
 *     }
 *   }
 *
 *   error(error: Error): void {
 *     console.error(error);
 *   }
 * }
 *
 * const participant = new MyParticipant(['TopicA', 'TopicB']);
 * ```
 */
export abstract class TAbstractParticipant<
  T extends PubSubTopics,
  K extends keyof T = keyof T,
> extends TAbstractObserver<ParticipantTopicMessage<T, K>>
  implements TParticipant<T, K> {
  /**
   * The mediators this participant is subscribed to.
   */
  protected mediators: TBaseMediator<PubSubTopics<T>>[] = [];

  /**
   * The unique identifier for this participant.
   */
  public readonly participantId: symbol;

  /**
   * The topics this subscriber is subscribed to.
   */
  public readonly topics: K[];

  /**
   * Initializes a new instance of the {@link TAbstractSubscriber} class with the topics the instance will subscribe to.
   *
   * @param topics - The topics this subscriber is subscribed to.
   *
   * You must specify the topics you want the subscriber to observe from the list of topics available in the `T` type.
   *
   * This allows implementers to create a subscriber that is capable of listening to specific topics,
   * while allowing instance implementers to specify which topics they want to observe.
   */
  constructor(topics: K[] = []) {
    super();

    this.topics = topics;
    this.participantId = Symbol('participantId');
  }

  /**
   * Subscribes the participant to a mediator.
   *
   * @param mediator The mediator to subscribe to.
   * @returns A disposable that can be used to unsubscribe the participant from the mediator.
   */
  public subscribe(mediator: TBaseMediator<PubSubTopics<T>>): IDisposable {
    const { mediators } = this;

    if (!mediators.includes(mediator)) {
      mediators.push(mediator);
      mediator.subscribe(this);
    }

    const disposable = new TSubscription(mediators, mediator);

    return disposable;
  }

  /**
   * Publishes a message to the mediator.
   *
   * @param message The message to publish.
   * @returns void
   */
  publish(message: ParticipantTopicMessage<T>): void {
    const { mediators, participantId } = this;

    mediators.forEach((mediator) => {
      mediator.next([participantId, ...message]);
    });
  }
}
