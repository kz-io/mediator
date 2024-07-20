import { type TObserver, TSubscription } from '@kz/observe';

import type { IDisposable } from '@kz/dispose';
import {
  type PubSubTopics,
  TBasePublisher,
  type TSubscriber,
} from '@kz/pubsub';
import type {
  MediatorTopicMessage,
  ParticipantTopicMessage,
  TParticipant,
} from './types/mod.ts';

/**
 * Provides a base implementation for a mediator that can publish and route topical notifications.
 *
 * @typeParam T - The topics-to-type map of the types being observed.
 *
 * @example
 * ```ts
 * import { TBaseMediator } from './t_base_mediator.ts';
 *
 * type MyTopics = {
 *   TopicA: string;
 *   TopicB: { value: number };
 *   TopicC: { timestamp: Date };
 * };
 *
 * const mediator = new TBaseMediator<MyTopics>();
 * mediator.publish(['TopicA', 'Hello, world!']);
 * ```
 */
export class TBaseMediator<T extends PubSubTopics> extends TBasePublisher<T>
  implements TObserver<MediatorTopicMessage<T>> {
  /**
   * The topics this mediator is subscribed to.
   */
  readonly topics: (keyof T)[] = [];

  /**
   * Routes a message to the appropriate subscribers.
   *
   * @param value The message to route to the appropriate subscribers.
   */
  public next(value: MediatorTopicMessage<T>): void {
    const { observers } = this;
    const [sender, topic, message] = value;

    observers.forEach((observer) => {
      if (!('topics' in observer)) return observer.next([topic, message]);

      if (!('participantId' in observer)) {
        const subscriber = observer as unknown as TSubscriber<T, keyof T>;
        const { topics } = subscriber;

        if (topics.includes(topic)) {
          subscriber.next([topic, message]);
        }

        return;
      }

      const participant = observer as unknown as TParticipant<T, keyof T>;
      const { topics, participantId } = participant;

      if (topics.includes(topic) && participantId !== sender) {
        participant.next([topic, message]);
      }
    });
  }

  /**
   * Subscribes an observer to the mediator.
   *
   * @param observer The observer to subscribe to the mediator.
   * @returns A disposable that can be used to unsubscribe the observer from the mediator.
   */
  public subscribe(
    observer: TObserver<ParticipantTopicMessage<T>>,
  ): IDisposable {
    const { observers } = this;

    if (!observers.includes(observer)) {
      observers.push(observer);

      if ('subscribe' in observer && 'publish' in observer) {
        const participant = observer as unknown as TParticipant<T, keyof T>;

        const disposable = participant.subscribe(this);

        return disposable;
      }

      return new TSubscription(this.observers, observer);
    }

    if ('subscribe' in observer && 'publish' in observer) {
      const participant = observer as unknown as TParticipant<T, keyof T>;
      const disposable = participant.subscribe(this);

      const localSubscription = new TSubscription(this.observers, observer);

      return {
        get isDisposed() {
          return localSubscription.isDisposed && disposable.isDisposed;
        },
        dispose(): void {
          localSubscription.dispose();
          disposable.dispose();
        },
      };
    }

    return new TSubscription(this.observers, observer);
  }

  /**
   * Logs an error to the console.
   *
   * @param error The error to log.
   */
  public error(error: Error): void {
    console.error(error);
  }
}
