/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
import { Component, useMemo, useState, useEffect } from 'react'
import { DatastoreDialog } from './DatastoreSelectionDialog'
import { Grid, Box, Button } from '@mui/material'

import { T, RESOURCE_NAMES } from 'client/constants'
import { BoxIso as DownloadIcon } from 'iconoir-react'
import { useViews } from 'client/features/Auth'
import { useGeneralApi } from 'client/features/General'
import { useGetVRouterTemplatesQuery } from 'client/features/OneApi/vrouterTemplate'
import {
  useLazyGetMarketplacesQuery,
  useEnableMarketplaceMutation,
} from 'client/features/OneApi/marketplace'

import {
  useLazyGetMarketplaceAppsQuery,
  useExportAppMutation,
} from 'client/features/OneApi/marketplaceApp'
import { useLazyGetDatastoresQuery } from 'client/features/OneApi/datastore'
import { debounce } from 'lodash'
import EnhancedTable, { createColumns } from 'client/components/Tables/Enhanced'
import VRouterTemplateColumns from 'client/components/Tables/VRouterTemplates/columns'
import VRouterTemplateRow from 'client/components/Tables/VRouterTemplates/row'
import InfoEmpty from 'iconoir-react/dist/InfoEmpty'
import { Translate } from 'client/components/HOC'
import { useStyles } from 'client/components/Tabs/EmptyTab/styles'

const DEFAULT_DATA_CY = 'vrouter-templates'

/**
 * @param {object} props - Table props
 * @returns {Component} - VRouter Templates table
 */
const VRouterTemplatesTable = (props) => {
  const { rootProps = {}, searchProps = {}, ...rest } = props ?? {}

  const classes = useStyles()

  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const { enqueueError, enqueueSuccess, enqueueInfo } = useGeneralApi()
  const { view, getResourceView } = useViews()
  const [loading, setLoading] = useState(false)
  const [oneMarket, setOneMarket] = useState(null)
  const [defaultImage, setDefaultImage] = useState(null)
  const [disableDownload, setDisableDownload] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [enableMarketplace] = useEnableMarketplaceMutation()
  const [exportApp] = useExportAppMutation()
  const { data = [], isFetching, refetch } = useGetVRouterTemplatesQuery()
  const [
    fetchMarketplaces,
    { data: marketplaces = [], isFetching: fetchingMarketplaces },
  ] = useLazyGetMarketplacesQuery(undefined, {
    skip: true, // Does not run on initial render
  })

  const [
    fetchDatastores,
    { data: datastores = [], isFetching: fetchingDatastores },
  ] = useLazyGetDatastoresQuery(undefined, {
    skip: true, // Does not run on initial render
  })

  const [
    fetchMarketplaceApps,
    { data: marketplaceApps = [], isFetching: fetchingMarketplaceApps },
  ] = useLazyGetMarketplaceAppsQuery(undefined, { skip: true }) // Does not run on initial render

  useEffect(() => {
    setLoading(isFetching || fetchingMarketplaces)
  }, [isFetching, fetchingMarketplaces])

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.VM_TEMPLATE)?.filters,
        columns: VRouterTemplateColumns,
      }),
    [view]
  )

  const submitDisabled = useMemo(
    () =>
      !(
        !fetchingMarketplaces &&
        !fetchingMarketplaceApps &&
        !fetchingDatastores
      ),
    [fetchingMarketplaces, fetchingMarketplaceApps, fetchingDatastores]
  )

  const handleDownloadDefaultImage = debounce(
    async () => {
      // Use cache if exists
      setDisableDownload(true)
      await fetchMarketplaces(undefined, true)
      await fetchDatastores(undefined, true)
      if (defaultImage !== null) {
        setDialogOpen(true)
      }
    },
    4000,
    { leading: true }
  )

  useEffect(() => {
    if (marketplaces?.length) {
      const mid =
        marketplaces?.find(
          (marketplace) => marketplace?.NAME === 'OpenNebula Public'
        ) ?? null
      mid !== null &&
        setOneMarket({
          ID: mid?.ID ?? -1,
          STATE: mid?.STATE === '0' ? 'ENABLED' : 'DISABLED',
        })
    }
  }, [marketplaces])

  useEffect(() => {
    // Internal ASYNC funcs -->

    const fetchApps = async () => {
      await fetchMarketplaceApps(undefined, true) // Prefer cache
    }

    const enableMarket = async (marketID) => {
      const response = await enableMarketplace({ id: marketID })
      if (response?.data === parseInt(marketID, 10)) {
        enqueueInfo('Enabled OpenNebula Public marketplace')
        setOneMarket({ ...oneMarket, STATE: 'ENABLED' })
        fetchApps()
      }

      return response
    }

    // <--Internal ASYNC funcs

    try {
      if (
        oneMarket !== null &&
        oneMarket?.ID !== -1 &&
        oneMarket?.STATE !== 'ENABLED'
      ) {
        enableMarket(oneMarket?.ID).catch(console.error)

        // Prefer cache
      } else if (
        oneMarket !== null &&
        oneMarket?.ID !== -1 &&
        oneMarket?.STATE === 'ENABLED'
      ) {
        fetchApps()
      }
    } catch {}
  }, [oneMarket])

  useEffect(() => {
    if (marketplaceApps?.length && !fetchingMarketplaceApps) {
      const vrTemplate =
        marketplaceApps?.find(
          (app) => app?.NAME === 'Service Virtual Router'
        ) ?? null
      setDefaultImage(vrTemplate)
    }
  }, [marketplaceApps])

  useEffect(() => {
    if (defaultImage !== null && !fetchingDatastores) {
      setDisableDownload(true)
      setDialogOpen(true)
    }
  }, [defaultImage, datastores])

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setDisableDownload(false)
  }

  const handleDownloadApp = async (datastoreId) => {
    await exportApp({
      id: defaultImage?.ID,
      name: 'Service Virtual Router',
      vmname: 'Service Virtual Router',
      datastore: datastoreId,
    })
      .then((res) => {
        if (res?.data) {
          enqueueSuccess('Downloaded default image') && refetch()
        } else if (res?.error) {
          enqueueError(res.error)
        } else {
          throw new Error('Unexpected problem occured')
        }
      })
      .catch((error) => {
        console.error(error)
      })
  }

  const filterDatastores = useMemo(() =>
    datastores?.filter((ds) => ds?.TYPE === '0')
  )

  const NoDataAvailable = () => (
    <>
      <Grid
        container
        sx={{
          alignItems: 'start',
          justifyContent: 'start',
          width: '100%',
          height: '100%',
        }}
      >
        <Grid item xs={12}>
          <Box className={classes.noDataMessage}>
            <InfoEmpty />
            <Translate word={T.NoDataAvailable} />
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ paddingLeft: 10 }}>
            <Button
              variant="outlined"
              color="primary"
              disabled={disableDownload}
              startIcon={<DownloadIcon />}
              onClick={() => handleDownloadDefaultImage()}
            >
              {T.DownloadDefaultImage}
            </Button>
          </Box>
        </Grid>
      </Grid>

      <DatastoreDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        datastores={filterDatastores}
        submitDisabled={submitDisabled}
        onSelect={(ds) => handleDownloadApp(ds?.ID ?? -1)}
      />
    </>
  )

  return (
    <EnhancedTable
      columns={columns}
      data={useMemo(() => data, [data])}
      rootProps={rootProps}
      searchProps={searchProps}
      refetch={refetch}
      isLoading={loading}
      getRowId={(row) => String(row.ID)}
      RowComponent={VRouterTemplateRow}
      noDataCustomRenderer={<NoDataAvailable />}
      {...rest}
    />
  )
}

VRouterTemplatesTable.propTypes = { ...EnhancedTable.propTypes }
VRouterTemplatesTable.displayName = 'VRouterTemplatesTable'

export default VRouterTemplatesTable
