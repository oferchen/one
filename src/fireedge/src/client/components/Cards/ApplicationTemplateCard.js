import React, { memo } from 'react'
import PropTypes from 'prop-types'

import {
  makeStyles,
  Box,
  Badge,
  Button,
  CardContent,
  CardActions
} from '@material-ui/core'
import FileIcon from '@material-ui/icons/Description'
import VideogameAssetIcon from '@material-ui/icons/VideogameAsset'
import AccountTreeIcon from '@material-ui/icons/AccountTree'

import { Tr } from 'client/components/HOC'
import SelectCard from './SelectCard'

const useStyles = makeStyles(theme => ({
  badgesWrapper: {
    display: 'flex',
    gap: theme.typography.pxToRem(12)
  }
}))

const ApplicationTemplateCard = memo(
  ({ value, handleEdit, handleDeploy, handleShow, handleRemove }) => {
    const classes = useStyles()
    const { NAME, TEMPLATE } = value
    const { description, networks = [], roles = [] } = TEMPLATE.BODY

    const numberOfTiers = roles?.length ?? 0
    const numberOfNetworks = Object.keys(networks)?.length ?? 0

    const badgePosition = { vertical: 'top', horizontal: 'right' }

    return (
      <SelectCard
        icon={<FileIcon />}
        title={NAME}
        subheader={description}
      >
        <CardContent>
          <Box className={classes.badgesWrapper}>
            <Badge
              showZero
              title={Tr('Tiers')}
              classes={{ badge: 'badge' }}
              color="primary"
              badgeContent={numberOfTiers}
              anchorOrigin={badgePosition}
            >
              <VideogameAssetIcon />
            </Badge>
            <Badge
              showZero
              title={Tr('Networks')}
              classes={{ badge: 'badge' }}
              color="primary"
              badgeContent={numberOfNetworks}
              anchorOrigin={badgePosition}
            >
              <AccountTreeIcon />
            </Badge>
          </Box>
        </CardContent>
        <CardActions>
          {handleEdit && (
            <Button
              variant="contained"
              size="small"
              onClick={handleEdit}
              disableElevation
            >
              {Tr('Edit')}
            </Button>
          )}
          {handleDeploy && (
            <Button
              variant="contained"
              size="small"
              onClick={handleDeploy}
              disableElevation
            >
              {Tr('Deploy')}
            </Button>
          )}
          {handleShow && (
            <Button
              variant="contained"
              size="small"
              onClick={handleShow}
              disableElevation
            >
              {Tr('Info')}
            </Button>
          )}
          {handleRemove && (
            <Button size="small" onClick={handleRemove} disableElevation>
              {Tr('Remove')}
            </Button>
          )}
        </CardActions>
      </SelectCard>
    )
  }
)

ApplicationTemplateCard.propTypes = {
  value: PropTypes.shape({
    ID: PropTypes.string.isRequired,
    NAME: PropTypes.string.isRequired,
    TEMPLATE: PropTypes.shape({
      BODY: PropTypes.shape({
        description: PropTypes.string,
        networks: PropTypes.object,
        roles: PropTypes.arrayOf(PropTypes.object)
      }).isRequired
    }).isRequired
  }),
  handleEdit: PropTypes.func,
  handleDeploy: PropTypes.func,
  handleShow: PropTypes.func,
  handleRemove: PropTypes.func
}

ApplicationTemplateCard.defaultProps = {
  value: {},
  handleEdit: undefined,
  handleDeploy: undefined,
  handleShow: undefined,
  handleRemove: undefined
}

ApplicationTemplateCard.displayName = 'Application TemplateCard'

export default ApplicationTemplateCard