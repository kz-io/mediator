<p align="center">
<img alt="kz logo" height="48" src="https://raw.githubusercontent.com/i11n/.github/main/svg/kz/color/kz.svg" />
<strong>mediator</strong>
</p>

<p align="center">
kz is a collection of easy-to-use utility and feature libraries for creating anything you want with the <a href="https://deno.com">Deno</a> runtime.
</p>

<h1 align="center">@kz/mediator</h1>

<p align="center">
The <code>@kz/patterns/mediator</code> module provides types and features for implementing the mediator pattern.
</p>

<p align="center">
<a href="https://jsr.io/@kz/mediator">Overview</a> |
<a href="https://jsr.io/@kz/mediator/doc">API Docs</a>
</p>

## Examples

```ts
import { AbstractDisposable } from '@kz/dispose';
import { TAbstractObserver } from '@kz/observe';
import { type PubSubTopicMessage, TAbstractSubscriber } from '@kz/pubsub';
import {
  type ParticipantTopicMessage,
  TAbstractParticipant,
  TBaseMediator,
} from './mod.ts';

interface IUserResponse {
  name: string;
  birthYear: string;
}

type MediatorTopics = {
  'get_users': undefined;
  'get_user': number;
  'user_response': IUserResponse;
  'users_response': IUserResponse[];
};

class SwapiClient extends AbstractDisposable {
  protected cache = new Map<string, string>();

  constructor(protected baseUrl: string = 'https://swapi.dev/api') {
    super();
  }

  public dispose(): void {
    this.cache.clear();
  }

  protected async request(slug: string, id?: number): Promise<string> {
    const { cache, baseUrl } = this;
    const uri = id ? `${baseUrl}/${slug}/${id}` : `${baseUrl}/${slug}`;
    const cached = cache.get(uri);
    if (cached) return cached;
    const response = await fetch(uri);
    const data = await response.text();
    cache.set(uri, data);
    return data;
  }

  public async getPeople(id?: number): Promise<string> {
    return await this.request('people', id);
  }
}

const client = new SwapiClient();

class DataBus extends TBaseMediator<MediatorTopics> {
}

type DataBusRequest = Extract<keyof MediatorTopics, 'get_users' | 'get_user'>;

class UserDataHandler
  extends TAbstractParticipant<MediatorTopics, 'get_users' | 'get_user'> {
  public next(
    value: ParticipantTopicMessage<MediatorTopics, 'get_users' | 'get_user'>,
  ): void {
    const [topic, message] = value;

    if (topic === 'get_users') {
      client.getPeople().then((data) => {
        const users = JSON.parse(data) as { results: any[] };
        const userData = users.results.map((user) => {
          return { name: user.name, birthYear: user.birth_year };
        }) as IUserResponse[];

        this.publish(['users_response', userData]);
      });
    }
    if (topic === 'get_user') {
      client.getPeople(message).then((data) => {
        const user = JSON.parse(data);
        const userData = {
          name: user.name,
          birthYear: user.birth_year,
        } as IUserResponse;

        this.publish(['user_response', userData]);
      });
    }
  }

  public error(error: Error): void {
    console.error(error);
  }
}

//  Will receive all messages from the mediator and be able to send requests back.
class UserParticipant extends TAbstractParticipant<MediatorTopics> {
  public next(value: ParticipantTopicMessage<MediatorTopics>): void {
    const [topic] = value;

    console.log(`Participant(${topic}): Received a user update`);
  }

  public error(error: Error): void {
    console.error(error);
  }
}

//  Yes! You can use pubsub subscriber to subscribe to a mediator.
//  Will receive updated user information, but not the request to do so.
//  Is unable to send requests back.
class UserSubscriber extends TAbstractSubscriber<
  MediatorTopics,
  'user_response' | 'users_response'
> {
  public next(
    value: ParticipantTopicMessage<
      MediatorTopics,
      'user_response' | 'users_response'
    >,
  ): void {
    const [topic, message] = value;

    if (topic === 'user_response') {
      console.log(
        `UserSub(${topic}): Updating user to ${
          (message as IUserResponse).name
        }`,
      );
    } else {
      console.log(
        `UserSub(${topic}): Updating users ${
          (message as IUserResponse[]).length
        }`,
      );
    }
  }

  public error(error: Error): void {
    console.error(error);
  }
}

//  Yes! You can use regular observers to subscribe to a mediator.
//  Because they cannot specify a topic, they will receive all messages from the mediator.
class UserObserver
  extends TAbstractObserver<PubSubTopicMessage<MediatorTopics>> {
  public next(value: ParticipantTopicMessage<MediatorTopics>): void {
    const [topic] = value;

    console.log(`Observer(${topic}): Received a user update`);
  }

  public error(error: Error): void {
    console.error(error);
  }
}

const bus = new DataBus();
const handler = new UserDataHandler(['get_users', 'get_user']);
const participant = new UserParticipant(['get_users', 'get_user']);
const subscriber = new UserSubscriber(['user_response', 'users_response']);
const observer = new UserObserver();

bus.subscribe(handler);
bus.subscribe(participant);
bus.subscribe(subscriber);
bus.subscribe(observer);

bus.publish(['get_users', undefined]); // go ahead and initialize data
bus.publish(['get_user', 1]); // get a specific user

participant.publish(['get_user', 2]); // get another specific user
```

## Contributing

Contributions are welcome! Take a look at our [contributing guidelines][contributing] to get started.

<p align="center">
<a href="https://github.com/i11n/.github/blob/main/.github/CODE_OF_CONDUCT.md">
  <img alt="Contributor Covenant" src="https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg?style=flat-square" />
</a>
</p>

## License

The MIT License (MIT) 2020-2024 integereleven. Refer to [LICENSE][license] for details.

<p align="center">
<sub>Built with ❤ by integereleven</sub>
</p>

<p align="center">
<img
  alt="@kz logo"
  height="64"
  src="https://raw.githubusercontent.com/i11n/.github/main/svg/brand/color/open-stroke.svg"
/>
</p>

<p align="center">
<a href="https://github.com/kz-io/mediator/commits">
  <img alt="GitHub commit activity" src="https://img.shields.io/github/commit-activity/m/kz-io/mediator?style=flat-square">
</a>
<a href="https://github.com/kz-io/mediator/issues">
  <img alt="GitHub issues" src="https://img.shields.io/github/issues-raw/kz-io/mediator?style=flat-square">
</a>
<a href="https://codecov.io/gh/kz-io/mediator" >
  <img src="https://codecov.io/gh/kz-io/mediator/graph/badge.svg?token=TH8uOvl1sk"/>
</a>
</p>

<p align="center">
<a href="https://jsr.io/@kz/mediator">
  <img src="https://jsr.io/badges/@kz/mediator" alt="" />
</a>
<a href="https://jsr.io/@kz/mediator">
  <img src="https://jsr.io/badges/@kz/mediator/smediator" alt="" />
</a>
</p>

[deno]: https://deno.dom "Deno homepage"
[jsr]: https://jsr.io "JSR homepage"
[branches]: https://github.com/kz-io/mediator/branches "@kz/mediator branches on GitHub"
[releases]: https://github.com/kz-io/mediator/releases "@kz/mediator releases on GitHub"
[contributing]: https://github.com/kz-io/mediator/blob/main/CONTRIBUTING.md "@kz/mediator contributing guidelines"
[license]: https://github.com/kz-io/mediator/blob/main/LICENSE "@kz/mediator license"

<!-- TODO: Update with links to modules on jsr -->
