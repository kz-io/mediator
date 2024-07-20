/**
 * @copyright 2020-2024 integereleven. All rights reserved. MIT license.
 * @file This file tests the features of the module.
 */

import { describe, it } from '@std/testing/bdd';
import { assertSpyCalls, spy } from '@std/testing/mock';

import {
  type ParticipantTopicMessage,
  TAbstractParticipant,
  TBaseMediator,
} from './mod.ts';

import { TAbstractObserver } from '@kz/observe';
import { PubSubTopicMessage, TAbstractSubscriber } from '@kz/pubsub';
import { assert } from 'jsr:@std/assert@^0.221.0/assert';

type MediatorTopics = {
  TopicA: string;
  TopicB: { value: number };
  TopicC: {
    timestamp: Date;
    details: {
      facility: string;
      severity: number;
      message: string;
    };
  };
};

class MyParticipant extends TAbstractParticipant<MediatorTopics> {
  public next(value: ParticipantTopicMessage<MediatorTopics>): void {
    const [topic, message] = value;

    if (topic === 'TopicA') {
      console.log(message);
    } else if (topic === 'TopicB') {
      console.log(
        `Took ${
          (message as MediatorTopics['TopicB']).value
        } seconds to complete.`,
      );
    } else {
      console.log(
        `Completed at ${(message as MediatorTopics['TopicC']).timestamp}.`,
      );
    }
  }

  public error(error: Error): void {
    console.error(error);
  }
}
class MyTopAParticipant extends TAbstractParticipant<MediatorTopics, 'TopicA'> {
  public next(value: ParticipantTopicMessage<MediatorTopics, 'TopicA'>): void {
    console.log(value);
  }

  public error(error: Error): void {
    console.error(error);
  }
}

class MySubscriber extends TAbstractSubscriber<MediatorTopics> {
  public next(message: PubSubTopicMessage<MediatorTopics>): void {
    console.log(message);
  }

  public error(error: Error): void {
    console.error(error);
  }
}

class MyTopicASubscriber extends TAbstractSubscriber<MediatorTopics, 'TopicA'> {
  public next(message: PubSubTopicMessage<MediatorTopics, 'TopicA'>): void {
    console.log(message);
  }

  public error(error: Error): void {
    console.error(error);
  }
}

class BasicObserver
  extends TAbstractObserver<PubSubTopicMessage<MediatorTopics, 'TopicA'>> {
  public next(value: PubSubTopicMessage<MediatorTopics, 'TopicA'>): void {
    console.log(value);
  }

  public error(error: Error): void {
    console.error(error);
  }
}

describe('mediator', () => {
  describe('module test', () => {
    const mediator = new TBaseMediator<MediatorTopics>();
    const ptc1 = new MyParticipant(['TopicA', 'TopicB']);
    const ptc2 = new MyTopAParticipant(['TopicA']);
    const sub1 = new MySubscriber(['TopicA', 'TopicB', 'TopicC']);
    const sub2 = new MySubscriber(['TopicA', 'TopicB', 'TopicC']);
    const sub3 = new MySubscriber(['TopicA', 'TopicB', 'TopicC']);
    const sub4 = new MyTopicASubscriber(['TopicA']);
    const observer = new BasicObserver();

    mediator.subscribe(ptc1);
    ptc2.subscribe(mediator);
    mediator.subscribe(sub1);
    mediator.subscribe(sub2);
    mediator.subscribe(sub3);
    mediator.subscribe(sub4);
    mediator.subscribe(observer);

    const messageA: PubSubTopicMessage<MediatorTopics> = [
      'TopicA',
      'Hello, world!',
    ];

    const messageB: PubSubTopicMessage<MediatorTopics> = ['TopicB', {
      value: 42,
    }];

    const messageC: PubSubTopicMessage<MediatorTopics> = ['TopicC', {
      timestamp: new Date(),
      details: {
        facility: 'syslog',
        severity: 1,
        message: 'Hello, world!',
      },
    }];

    it('should publish a message to all subscribers', () => {
      const mediatorSpy = spy(mediator, 'next');
      const spyParticipant1 = spy(ptc1, 'next');
      const spyParticipant2 = spy(ptc2, 'next');
      const spySubscriber1 = spy(sub1, 'next');
      const spySubscriber2 = spy(sub2, 'next');
      const spySubscriber3 = spy(sub3, 'next');
      const spySubscriber4 = spy(sub4, 'next');
      const spyObserver = spy(observer, 'next');

      mediator.publish(messageA);
      mediator.publish(messageB);
      mediator.publish(messageC);
      ptc1.publish(messageA);
      ptc2.publish(messageB);

      assertSpyCalls(mediatorSpy, 2);
      assertSpyCalls(spyParticipant1, 3);
      assertSpyCalls(spyParticipant2, 2);
      assertSpyCalls(spySubscriber1, 5);
      assertSpyCalls(spySubscriber2, 5);
      assertSpyCalls(spySubscriber3, 5);
      assertSpyCalls(spySubscriber4, 2);
      assertSpyCalls(spyObserver, 5); // listening to all as an observer

      mediatorSpy.restore();
      spyParticipant1.restore();
      spyParticipant2.restore();
      spySubscriber1.restore();
      spySubscriber2.restore();
      spySubscriber3.restore();
      spySubscriber4.restore();
      spyObserver.restore();
    });
  });

  describe('TAbstractParticipant', () => {
    it('should not publish without a mediator', () => {
      const mediator = new TBaseMediator<MediatorTopics>();
      const ptc = new MyParticipant(['TopicA', 'TopicB']);
      const subscription = ptc.subscribe(mediator);

      assert(!subscription.isDisposed);
      subscription.dispose();
      assert(subscription.isDisposed);

      const spyParticipant = spy(mediator, 'next');

      ptc.publish(['TopicA', 'Hello, world!']);

      assertSpyCalls(spyParticipant, 0);

      spyParticipant.restore();
    });

    it('should not duplicate participants', () => {
      const mediator = new TBaseMediator<MediatorTopics>();
      const ptc = new MyParticipant(['TopicA', 'TopicB']);
      const observer = new BasicObserver();
      mediator.subscribe(ptc);
      const otherSubScription = mediator.subscribe(ptc);

      observer.subscribe(mediator);
      mediator.subscribe(observer);
      mediator.error(new Error('Test error'));

      assert(!otherSubScription.isDisposed);
      otherSubScription.dispose();
      assert(!otherSubScription.isDisposed);

      observer.unsubscribe();
      assert(otherSubScription.isDisposed);

      const spyParticipant = spy(mediator, 'next');

      ptc.publish(['TopicA', 'Hello, world!']);

      assertSpyCalls(spyParticipant, 0);

      spyParticipant.restore();
    });
  });
});
