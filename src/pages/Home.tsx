import {
  Box,
  Column,
  Container,
  Heading,
  Row,
  Text,
  useLayout,
} from 'paramount-ui';
import React from 'react';
import { withRouter } from 'react-router';

import { Background } from '../components/Background';
import { BlogSection } from '../components/BlogSection';
import { CTAButton } from '../components/CTAButton';
import { Footer } from '../components/Footer';
import { Link } from '../components/Link';
import { WebImage } from '../components/WebImage';
import { QuestionList } from '../oracle/QuestionList';

const HeroSection = withRouter(props => {
  const { history } = props;

  return (
    <Box paddingVertical={40}>
      <Container>
        <Row>
          <Column medium={6}>
            <Heading size="xxxlarge" color="primary">
              Crowd-sourced veriFication for smart contracts
            </Heading>
            <Box paddingBottom={40}>
              <Text>
                Trusted Oracle provides a flexible mechanism for bringing
                off-chain events on-chain, so data is easily accessible by smart
                contracts.
              </Text>
              <Link to="/how-it-works">See how it works</Link>
            </Box>
            <Box alignItems="flex-start" paddingBottom={24}>
              <CTAButton
                title="Ask a question"
                onPress={() => {
                  history.push('/ask-question');
                }}
              />
            </Box>
          </Column>
          <Column medium={6}>
            <WebImage
              alt="trusted-oracle hero"
              src={require('../assets/images/oracle-hero.png')}
            />
          </Column>
        </Row>
      </Container>
    </Box>
  );
});

const AskAQuestionSection = withRouter(props => {
  const { history } = props;

  return (
    <Background pattern="textured">
      <Box paddingVertical={60}>
        <Container>
          <Row>
            <Column medium={6} offsetMedium={3}>
              <Heading size="xxxlarge" align="center" color="primary">
                ASK A QUESTION
              </Heading>
              <Box paddingBottom={40}>
                <Text align="center">
                  In order to use Trusted Oracle, ask a question you'd like to
                  know the answer to. The best questions can easily be publicly
                  verified and an accurate answer determined. Although it is not
                  required, Trustcoins (TRST) can be added to questions to
                  incentivize reporters to answer. If you plan to answer the
                  question yourself, you can leave the reward as zero.
                </Text>
                <Link
                  style={{ textAlign: 'center' }}
                  to="https://cryptounlocked.wetrust.io/"
                  isExternal
                >
                  View more details
                </Link>
              </Box>
              <Box alignItems="center">
                <CTAButton
                  title="Ask a question"
                  onPress={() => {
                    history.push('/ask-question');
                  }}
                />
              </Box>
            </Column>
          </Row>
        </Container>
      </Box>
    </Background>
  );
});

const HowItWorksSection = () => {
  const { getResponsiveValue } = useLayout();

  return (
    <Background pattern="dotted">
      <Box paddingVertical={60}>
        <Container>
          <Row>
            <Column medium={6} offsetMedium={3}>
              <Box paddingBottom={40}>
                <Heading size="xxxlarge" align="center" color="secondary">
                  HOW IT WORKS
                </Heading>
              </Box>
            </Column>
          </Row>
          <Row>
            <Column>
              <Box paddingBottom={60}>
                <WebImage
                  alt="trusted-oracle how it works"
                  src={getResponsiveValue({
                    xlarge: require('../assets/images/how-it-works.png'),
                    xsmall: require('../assets/images/how-it-works-mobile.svg'),
                  })}
                />
              </Box>
            </Column>
          </Row>
          <Row>
            <Column medium={6} offsetMedium={3}>
              <Box alignItems="center">
                <CTAButton appearance="outline" title="More details" />
              </Box>
            </Column>
          </Row>
        </Container>
      </Box>
    </Background>
  );
};

const GetTRSTSection = () => {
  const { getResponsiveValue } = useLayout();

  return (
    <Background pattern="textured">
      <Box paddingVertical={60}>
        <Container>
          <Row>
            <Column medium={6} offsetMedium={3}>
              <Heading size="xxxlarge" align="center" color="primary">
                GET TRST
              </Heading>
              <Box paddingBottom={40}>
                <Text align="center">
                  Use Bancor or Uniswap to get TRST Coins and use your TRST as a
                  reward to encourage others to answer your questions. The final
                  answer will claim this reward.
                </Text>
              </Box>
              <Box
                {...getResponsiveValue({
                  large: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  },
                })}
              >
                <Box paddingBottom={24}>
                  <CTAButton
                    appearance="outline"
                    icon={
                      <WebImage
                        alt="get trst via banchor"
                        src={require('../assets/images/banchor.png')}
                      />
                    }
                  />
                </Box>
                <CTAButton
                  appearance="outline"
                  icon={
                    <WebImage
                      alt="get trst via uniswap"
                      src={require('../assets/images/uniswap.png')}
                    />
                  }
                />
              </Box>
            </Column>
          </Row>
        </Container>
      </Box>
    </Background>
  );
};

export const Home = () => {
  return (
    <Box>
      <HeroSection />
      <QuestionList />
      <AskAQuestionSection />
      <HowItWorksSection />
      <GetTRSTSection />
      <BlogSection />
      <Footer />
    </Box>
  );
};
