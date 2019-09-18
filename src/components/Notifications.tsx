import {
  Box,
  Column,
  Container,
  Heading,
  Icon,
  Row,
  Text,
  useLayout,
  useTheme,
} from 'paramount-ui';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { withRouter } from 'react-router';
import { useAsync } from 'react-use';

import { useStore } from '../oracle/StoreProvider';
import { Background } from './Background';
import { Link } from './Link';

interface NotificationProps {
  questionId: string;
  questionTitle: string;
  date: string;
  message: string;
}

export const Notification = (props: NotificationProps) => {
  const { questionId, questionTitle, date, message } = props;

  return (
    <Link to={`/question/${questionId}`}>
      <Box>
        <Box paddingBottom={16}>
          <Text color="muted">
            {message} {date}
          </Text>
          <Text weight="bold">{questionTitle}</Text>
        </Box>
      </Box>
    </Link>
  );
};

export const Notifications = withRouter(props => {
  const { history } = props;
  const { notifications, getNotifications } = useStore();
  const theme = useTheme();
  const { getResponsiveValue } = useLayout();

  useAsync(async () => {
    getNotifications();
  }, [getNotifications]);

  return (
    <Box>
      <Box paddingTop={40} paddingLeft={16} alignItems="flex-start">
        <TouchableOpacity onPress={() => history.replace('/my-account')}>
          <View style={{ width: 40, height: 40 }}>
            <Icon
              size={24}
              name="arrow-left"
              color={theme.colors.text.primary}
            />
          </View>
        </TouchableOpacity>
      </Box>
      <Box
        paddingBottom={16}
        {...getResponsiveValue({
          large: {
            paddingHorizontal: 60,
          },
          xsmall: {
            paddingHorizontal: 16,
          },
        })}
      >
        <Heading align="center" color="primary" size="xxlarge">
          NOTIFICATIONS
        </Heading>
      </Box>
      <Background pattern="dotted">
        <Box
          {...getResponsiveValue({
            large: {
              paddingHorizontal: 60,
            },
            xsmall: {
              paddingHorizontal: 16,
            },
          })}
        >
          <Container>
            <Row>
              {notifications.map((notification, index) => (
                <Column key={index}>
                  <Box paddingBottom={24}>
                    <Notification {...notification} />
                  </Box>
                </Column>
              ))}
            </Row>
          </Container>
        </Box>
      </Background>
    </Box>
  );
});
