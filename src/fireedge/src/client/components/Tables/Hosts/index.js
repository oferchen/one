/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement, useCallback, useEffect, useMemo, useState } from 'react'

import { useViews } from 'client/features/Auth'
import { useGetHostsQuery } from 'client/features/OneApi/host'

import EnhancedTable, { createColumns } from 'client/components/Tables/Enhanced'
import {
  areArraysEqual,
  sortStateTables,
} from 'client/components/Tables/Enhanced/Utils/DataTableUtils'
import HostColumns from 'client/components/Tables/Hosts/columns'
import HostRow from 'client/components/Tables/Hosts/row'
import { RESOURCE_NAMES } from 'client/constants'
import { useFormContext } from 'react-hook-form'

const DEFAULT_DATA_CY = 'hosts'

/**
 * @param {object} props - Props
 * @returns {ReactElement} Hosts table
 */
const HostsTable = (props) => {
  const {
    rootProps = {},
    searchProps = {},
    useQuery = useGetHostsQuery,
    vdcHosts,
    zoneId,
    dependOf,
    filter,
    reSelectRows,
    value,
    ...rest
  } = props ?? {}
  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const { view, getResourceView } = useViews()

  let values

  if (typeof filter === 'function' && dependOf) {
    const { watch } = useFormContext()

    const getDataForDepend = useCallback(
      (n) => {
        let dependName = n
        // removes character '$'
        if (n.startsWith('$')) dependName = n.slice(1)

        return watch(dependName)
      },
      [dependOf]
    )

    const valuesOfDependField = () => {
      if (!dependOf) return null

      return Array.isArray(dependOf)
        ? dependOf.map(getDataForDepend)
        : getDataForDepend(dependOf)
    }
    values = valuesOfDependField()
  }

  const {
    data = [],
    isFetching,
    refetch,
  } = useQuery(
    { zone: zoneId },
    {
      selectFromResult: (result) => {
        const rtn = { ...result }
        if (vdcHosts) {
          const dataRequest = result.data ?? []
          rtn.data = dataRequest.filter((host) => vdcHosts.includes(host?.ID))
        } else if (typeof filter === 'function') {
          rtn.data = filter(result.data ?? [], values ?? [])
        }

        return rtn
      },
    }
  )

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.HOST)?.filters,
        columns: HostColumns,
      }),
    [view]
  )

  const [stateData, setStateData] = useState(data)

  const updateSelectedRows = () => {
    if (Array.isArray(values) && typeof reSelectRows === 'function') {
      const datastores = data
        .filter((dataObject) => value.includes(dataObject.ID))
        .map((dataObject) => dataObject.ID)

      const sortedDatastores = sortStateTables(datastores)
      const sortedValue = sortStateTables(value)
      if (!areArraysEqual(sortedValue, sortedDatastores)) {
        reSelectRows(sortedDatastores)
        setStateData(data)
      }
    }
  }

  useEffect(() => {
    updateSelectedRows()
  }, [dependOf])

  useEffect(() => {
    if (JSON.stringify(data) !== JSON.stringify(stateData)) {
      updateSelectedRows()
    }
  })
  useEffect(() => refetch(), [])

  return (
    <EnhancedTable
      columns={columns}
      data={useMemo(() => data, [data])}
      rootProps={rootProps}
      searchProps={searchProps}
      refetch={refetch}
      isLoading={isFetching}
      getRowId={(row) => String(row.ID)}
      RowComponent={HostRow}
      dataDepend={values}
      zoneId={zoneId}
      {...rest}
    />
  )
}

HostsTable.propTypes = { ...EnhancedTable.propTypes }
HostsTable.displayName = 'HostsTable'

export default HostsTable
