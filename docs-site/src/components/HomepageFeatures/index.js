import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Client',
    tag: '[UI]',
    description: (
      <>
        Dashboard UI for developers and operators, showing logs, alerts,
        notes, and AI-generated insights.
      </>
    ),
  },
  {
    title: 'Server Microservices',
    tag: '[API]',
    description: (
      <>
        Java 25 / Spring Boot 4 services split by responsibility, exposing
        REST APIs and coordinating persistent storage and GenAI analysis.
      </>
    ),
  },
  {
    title: 'GenAI',
    tag: '[AI]',
    description: (
      <>
        A separate Python service producing summaries, troubleshooting
        hints, and possible next steps from log content.
      </>
    ),
  },
];

function Feature({tag, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className={styles.featureBox}>
        <span className={styles.featureTag}>{tag}</span>
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
