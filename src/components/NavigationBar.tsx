import {
  Box,
  Container,
  Divider,
  Heading,
  Icon,
  Modal,
  Text,
  Visible,
} from 'paramount-ui';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';

import { BlockchainAccountStatus } from './BlockchainAccountStatus';
import { Link, LinkProps } from './Link';
import { Logo } from './Logo';
import { WeTrustProductsBanner } from './WeTrustProductsBanner';

const DesktopNavigationBarDivider = () => (
  <Divider
    position="vertical"
    getStyles={() => ({
      dividerStyle: {
        height: 30,
      },
    })}
  />
);

const DesktopNavigationBarLink = (props: LinkProps) => {
  const { children, to, isExternal } = props;

  return (
    <Link
      to={to}
      isExternal={isExternal}
      style={{ textDecoration: 'none', height: '100%' }}
    >
      <Box justifyContent="center" height="100%" paddingHorizontal={16}>
        <Text color="link">{children}</Text>
      </Box>
    </Link>
  );
};

const DesktopNavigationBar = () => {
  return (
    <>
      <Box
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
        backgroundColor="#222222"
        flexWrap="wrap"
        height={55}
      >
        <WeTrustProductsBanner />
      </Box>
      <Box
        flexDirection="row"
        height={80}
        justifyContent="space-between"
        paddingHorizontal={31}
        zIndex={1}
      >
        <Logo />
        <Box flexDirection="row" alignItems="center">
          <DesktopNavigationBarLink to="/">Home</DesktopNavigationBarLink>
          <DesktopNavigationBarDivider />
          <DesktopNavigationBarLink to="/ask-question">
            Ask a Question
          </DesktopNavigationBarLink>
          <DesktopNavigationBarDivider />
          <DesktopNavigationBarLink to="/how-it-works">
            How it works
          </DesktopNavigationBarLink>
          <DesktopNavigationBarDivider />
          <DesktopNavigationBarLink
            to="https://blog.wetrust.io/cryptounlocked-oracle-upgrade-5c8b22e3375b"
            isExternal
          >
            Get TRST
          </DesktopNavigationBarLink>
          <DesktopNavigationBarDivider />
          <DesktopNavigationBarLink to="https://blog.wetrust.io/" isExternal>
            Our Blog
          </DesktopNavigationBarLink>
          <Box paddingLeft={16}>
            <BlockchainAccountStatus />
          </Box>
        </Box>
      </Box>
      <Divider />
    </>
  );
};

const MobileNavigationMenuLink = (props: LinkProps) => {
  const { children, to, onClick, isExternal } = props;

  return (
    <Link to={to} onClick={onClick} isExternal={isExternal}>
      <Box alignItems="center" paddingVertical={16}>
        <Heading size="xxlarge" color="link">
          {children}
        </Heading>
      </Box>
      <Divider />
    </Link>
  );
};

interface MobileNavigationMenuProps {
  onClick?: () => void;
}

const MobileNavigationMenu = (props: MobileNavigationMenuProps) => {
  const { onClick } = props;

  return (
    <>
      <MobileNavigationMenuLink onClick={onClick} to="/">
        Home
      </MobileNavigationMenuLink>
      <MobileNavigationMenuLink onClick={onClick} to="/ask-question">
        Ask a Question
      </MobileNavigationMenuLink>
      <MobileNavigationMenuLink onClick={onClick} to="/how-it-works" isExternal>
        How it works
      </MobileNavigationMenuLink>
      <MobileNavigationMenuLink
        onClick={onClick}
        to="https://blog.wetrust.io/cryptounlocked-oracle-upgrade-5c8b22e3375b"
        isExternal
      >
        Get TRST
      </MobileNavigationMenuLink>
      <MobileNavigationMenuLink
        onClick={onClick}
        to="https://blog.wetrust.io/"
        isExternal
      >
        Our Blog
      </MobileNavigationMenuLink>
    </>
  );
};

const MobileNavigationBar = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <>
      <Container fluid>
        <Box
          flexDirection="row"
          height={60}
          justifyContent="space-between"
          zIndex={1}
        >
          <Logo />
          <Box flexDirection="row" alignItems="center">
            <BlockchainAccountStatus />
            <TouchableOpacity onPress={() => setIsMenuOpen(true)}>
              <View style={{ padding: 16 }}>
                <Icon name="menu" size={24} />
              </View>
            </TouchableOpacity>
          </Box>
        </Box>
        <Modal visible={isMenuOpen} onRequestClose={() => setIsMenuOpen(false)}>
          <Box flexDirection="row" height={60} justifyContent="flex-end">
            <TouchableOpacity onPress={() => setIsMenuOpen(false)}>
              <View style={{ padding: 16 }}>
                <Icon name="x" size={32} />
              </View>
            </TouchableOpacity>
          </Box>
          <Box paddingBottom={100}>
            <MobileNavigationMenu onClick={() => setIsMenuOpen(false)} />
          </Box>
          <Box paddingTop={48} backgroundColor="#222222" height="100%">
            <Box flexWrap="wrap" flexDirection="row" justifyContent="center">
              <WeTrustProductsBanner />
            </Box>
          </Box>
        </Modal>
      </Container>
      <Divider />
    </>
  );
};

export const NavigationBar = () => {
  return (
    <>
      <Visible xsmall small medium>
        <MobileNavigationBar />
      </Visible>
      <Visible large xlarge>
        <DesktopNavigationBar />
      </Visible>
    </>
  );
};
